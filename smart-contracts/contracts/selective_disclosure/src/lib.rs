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
    RequestAlreadyExists = 5,
    RequestNotFound = 6,
    RequestExpired = 7,
    ResponseAlreadyExists = 8,
    ResponseNotFound = 9,
    InvalidExpiry = 10,
    EmptyAttributes = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisclosureRequest {
    pub id: String,
    pub requester: Address,
    pub requested_attributes: Vec<Symbol>,
    pub purpose: String,
    pub expires_at: u64,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisclosureResponse {
    pub request_id: String,
    pub identity_id: String,
    pub responder: Address,
    pub commitment_root: BytesN<32>,
    pub proof: Bytes,
    pub disclosed_keys: Vec<Symbol>,
    pub created_at: u64,
    pub revoked: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Paused,
    RequestCount,
    ResponseCount,
    Request(String),
    Response(String),
}

#[contract]
pub struct SelectiveDisclosureContract;

#[contractimpl]
impl SelectiveDisclosureContract {
    /// Initialize the selective disclosure contract.
    pub fn initialize(env: Env, owner: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }

        owner.require_auth();

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::RequestCount, &0u64);
        env.storage().instance().set(&DataKey::ResponseCount, &0u64);

        Ok(())
    }

    /// Pause contract execution.
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

    /// Unpause contract execution.
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

    /// Check if paused.
    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Get contract administrator.
    pub fn get_owner(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    /// Create a selective disclosure request.
    pub fn create_request(
        env: Env,
        request_id: String,
        requester: Address,
        requested_attributes: Vec<Symbol>,
        purpose: String,
        expires_at: u64,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        requester.require_auth();

        let now = env.ledger().timestamp();
        if expires_at <= now {
            return Err(Error::InvalidExpiry);
        }
        if requested_attributes.is_empty() {
            return Err(Error::EmptyAttributes);
        }

        let req_key = DataKey::Request(request_id.clone());
        if env.storage().persistent().has(&req_key) {
            return Err(Error::RequestAlreadyExists);
        }

        let request = DisclosureRequest {
            id: request_id.clone(),
            requester: requester.clone(),
            requested_attributes,
            purpose,
            expires_at,
            created_at: now,
        };

        env.storage().persistent().set(&req_key, &request);

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RequestCount)
            .unwrap_or(0u64);
        env.storage()
            .instance()
            .set(&DataKey::RequestCount, &(count + 1));

        env.events().publish(
            (symbol_short!("req_new"), requester),
            request_id,
        );

        Ok(())
    }

    /// Respond to a selective disclosure request with zero-knowledge cryptographic commitment.
    pub fn respond_to_request(
        env: Env,
        request_id: String,
        identity_id: String,
        responder: Address,
        commitment_root: BytesN<32>,
        proof: Bytes,
        disclosed_keys: Vec<Symbol>,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        responder.require_auth();

        let req_key = DataKey::Request(request_id.clone());
        let request: DisclosureRequest = env
            .storage()
            .persistent()
            .get(&req_key)
            .ok_or(Error::RequestNotFound)?;

        let now = env.ledger().timestamp();
        if now > request.expires_at {
            return Err(Error::RequestExpired);
        }

        let resp_key = DataKey::Response(request_id.clone());
        if env.storage().persistent().has(&resp_key) {
            return Err(Error::ResponseAlreadyExists);
        }

        let response = DisclosureResponse {
            request_id: request_id.clone(),
            identity_id: identity_id.clone(),
            responder: responder.clone(),
            commitment_root,
            proof,
            disclosed_keys,
            created_at: now,
            revoked: false,
        };

        env.storage().persistent().set(&resp_key, &response);

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ResponseCount)
            .unwrap_or(0u64);
        env.storage()
            .instance()
            .set(&DataKey::ResponseCount, &(count + 1));

        env.events().publish(
            (symbol_short!("resp_new"), responder),
            request_id,
        );

        Ok(())
    }

    /// Revoke a disclosure response (callable only by the responder).
    pub fn revoke_response(
        env: Env,
        request_id: String,
        caller: Address,
        reason: String,
    ) -> Result<(), Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        caller.require_auth();

        let resp_key = DataKey::Response(request_id.clone());
        let mut response: DisclosureResponse = env
            .storage()
            .persistent()
            .get(&resp_key)
            .ok_or(Error::ResponseNotFound)?;

        if caller != response.responder {
            return Err(Error::Unauthorized);
        }

        response.revoked = true;
        env.storage().persistent().set(&resp_key, &response);

        env.events().publish(
            (symbol_short!("resp_rev"), caller),
            (request_id, reason),
        );

        Ok(())
    }

    /// Retrieve a disclosure request.
    pub fn get_request(env: Env, request_id: String) -> Option<DisclosureRequest> {
        env.storage()
            .persistent()
            .get(&DataKey::Request(request_id))
    }

    /// Retrieve a disclosure response.
    pub fn get_response(env: Env, request_id: String) -> Option<DisclosureResponse> {
        env.storage()
            .persistent()
            .get(&DataKey::Response(request_id))
    }

    /// Check if a disclosure request has an active, unrevoked response.
    pub fn has_valid_response(env: Env, request_id: String) -> bool {
        let resp_opt: Option<DisclosureResponse> = env
            .storage()
            .persistent()
            .get(&DataKey::Response(request_id));

        match resp_opt {
            Option::Some(resp) => !resp.revoked,
            Option::None => false,
        }
    }
}

#[cfg(test)]
mod test;
