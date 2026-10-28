#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    Address, Bytes, BytesN, Env, String, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    IdentityAlreadyExists = 5,
    IdentityNotFound = 6,
    InvalidSignature = 7,
    VerificationNotFound = 8,
    AttributeAlreadyVerified = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Verification {
    pub id: String,
    pub attribute_id: String,
    pub verifier: Address,
    pub method: Symbol,
    pub proof: Bytes,
    pub created_at: u64,
    pub expires_at: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IdentityRecord {
    pub id: String,
    pub public_key: BytesN<65>,
    pub stellar_address: Address,
    pub attributes_hash: BytesN<32>,
    pub verifications: Vec<Verification>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Paused,
    IdentityCount,
    Identity(String),
    PubKeyToIdentity(BytesN<65>),
}

#[contract]
pub struct IdentityRegistryContract;

#[contractimpl]
impl IdentityRegistryContract {
    /// Initialize the contract with the designated administrator/owner.
    pub fn initialize(env: Env, owner: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }

        owner.require_auth();

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::IdentityCount, &0u64);

        Ok(())
    }

    /// Transfer contract administrative ownership.
    pub fn transfer_ownership(env: Env, new_owner: Address) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;

        owner.require_auth();
        new_owner.require_auth();

        env.storage().instance().set(&DataKey::Owner, &new_owner);
        Ok(())
    }

    /// Pause contract mutations (only callable by contract owner).
    pub fn pause(env: Env) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;

        owner.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        Ok(())
    }

    /// Unpause contract mutations (only callable by contract owner).
    pub fn unpause(env: Env) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;

        owner.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }

    /// Check if contract is currently paused.
    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Return the contract owner.
    pub fn get_owner(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    /// Return the total number of registered identities.
    pub fn get_identity_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::IdentityCount)
            .unwrap_or(0u64)
    }

    /// Check if an identity ID exists in persistent storage.
    pub fn identity_exists(env: Env, identity_id: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Identity(identity_id))
    }

    /// Register a new decentralized identity with Secp256r1 public key and initial attributes hash.
    pub fn register_identity(
        env: Env,
        identity_id: String,
        public_key: BytesN<65>,
        stellar_address: Address,
        attributes_hash: BytesN<32>,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        stellar_address.require_auth();

        let id_key = DataKey::Identity(identity_id.clone());
        if env.storage().persistent().has(&id_key) {
            return Err(Error::IdentityAlreadyExists);
        }

        let now = env.ledger().timestamp();
        let record = IdentityRecord {
            id: identity_id.clone(),
            public_key: public_key.clone(),
            stellar_address: stellar_address.clone(),
            attributes_hash,
            verifications: Vec::new(&env),
            created_at: now,
            updated_at: now,
        };

        env.storage().persistent().set(&id_key, &record);
        env.storage()
            .persistent()
            .set(&DataKey::PubKeyToIdentity(public_key), &identity_id);

        let count = Self::get_identity_count(env.clone());
        env.storage()
            .instance()
            .set(&DataKey::IdentityCount, &(count + 1));

        env.events().publish(
            (symbol_short!("id_reg"), stellar_address),
            identity_id,
        );

        Ok(())
    }

    /// Update an identity's attributes hash, signed by the identity's Stellar address.
    pub fn update_attributes(
        env: Env,
        identity_id: String,
        new_attributes_hash: BytesN<32>,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        let id_key = DataKey::Identity(identity_id.clone());
        let mut record: IdentityRecord = env
            .storage()
            .persistent()
            .get(&id_key)
            .ok_or(Error::IdentityNotFound)?;

        // Require authorization from the identity's bound Stellar address
        record.stellar_address.require_auth();

        record.attributes_hash = new_attributes_hash;
        record.updated_at = env.ledger().timestamp();

        env.storage().persistent().set(&id_key, &record);

        env.events().publish(
            (symbol_short!("id_upd"), record.stellar_address),
            identity_id,
        );

        Ok(())
    }

    /// Add a third-party verification for a specific attribute of an identity.
    pub fn add_verification(
        env: Env,
        identity_id: String,
        verification_id: String,
        attribute_id: String,
        verifier: Address,
        method: Symbol,
        proof: Bytes,
        expires_at: Option<u64>,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        // The verifier must authorize the attestation
        verifier.require_auth();

        let id_key = DataKey::Identity(identity_id.clone());
        let mut record: IdentityRecord = env
            .storage()
            .persistent()
            .get(&id_key)
            .ok_or(Error::IdentityNotFound)?;

        let now = env.ledger().timestamp();
        let verification = Verification {
            id: verification_id.clone(),
            attribute_id: attribute_id.clone(),
            verifier: verifier.clone(),
            method,
            proof,
            created_at: now,
            expires_at,
        };

        record.verifications.push_back(verification);
        record.updated_at = now;

        env.storage().persistent().set(&id_key, &record);

        env.events().publish(
            (symbol_short!("ver_add"), verifier),
            identity_id,
        );

        Ok(())
    }

    /// Revoke an existing attribute verification (callable by verifier or identity owner).
    pub fn revoke_verification(
        env: Env,
        identity_id: String,
        verification_id: String,
        caller: Address,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        caller.require_auth();

        let id_key = DataKey::Identity(identity_id.clone());
        let mut record: IdentityRecord = env
            .storage()
            .persistent()
            .get(&id_key)
            .ok_or(Error::IdentityNotFound)?;

        let is_owner = caller == record.stellar_address;
        let mut found_index: Option<u32> = Option::None;

        for (i, v) in record.verifications.iter().enumerate() {
            if v.id == verification_id {
                if !is_owner && caller != v.verifier {
                    return Err(Error::Unauthorized);
                }
                found_index = Option::Some(i as u32);
                break;
            }
        }

        match found_index {
            Option::Some(index) => {
                record.verifications.remove(index);
                record.updated_at = env.ledger().timestamp();
                env.storage().persistent().set(&id_key, &record);

                env.events().publish(
                    (symbol_short!("ver_rev"), caller),
                    verification_id,
                );

                Ok(())
            }
            Option::None => Err(Error::VerificationNotFound),
        }
    }

    /// Retrieve an identity record by its ID.
    pub fn get_identity(env: Env, identity_id: String) -> Option<IdentityRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::Identity(identity_id))
    }

    /// Retrieve an identity record by its Secp256r1 public key.
    pub fn get_identity_by_public_key(
        env: Env,
        public_key: BytesN<65>,
    ) -> Option<IdentityRecord> {
        let id_opt: Option<String> = env
            .storage()
            .persistent()
            .get(&DataKey::PubKeyToIdentity(public_key));

        match id_opt {
            Option::Some(id) => Self::get_identity(env, id),
            Option::None => Option::None,
        }
    }
}

#[cfg(test)]
mod test;
