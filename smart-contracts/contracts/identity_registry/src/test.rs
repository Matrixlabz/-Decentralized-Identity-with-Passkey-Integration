#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Bytes, BytesN, Env, String, Symbol,
};

fn setup_contract(env: &Env) -> (IdentityRegistryContractClient<'_>, Address) {
    let contract_id = env.register_contract(None, IdentityRegistryContract);
    let client = IdentityRegistryContractClient::new(env, &contract_id);
    let owner = Address::generate(env);
    client.initialize(&owner);
    (client, owner)
}

#[test]
fn test_initialize_and_owner() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup_contract(&env);

    assert_eq!(client.get_owner(), owner);
    assert_eq!(client.is_paused(), false);
    assert_eq!(client.get_identity_count(), 0);
}

#[test]
fn test_reinitialization_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let other_owner = Address::generate(&env);
    let res = client.try_initialize(&other_owner);
    assert_eq!(res.is_err(), true);
}

#[test]
fn test_register_and_get_identity() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let user_addr = Address::generate(&env);
    let id = String::from_str(&env, "did:stellar:user_123");
    let pub_key = BytesN::from_array(&env, &[7u8; 65]);
    let attr_hash = BytesN::from_array(&env, &[42u8; 32]);

    assert_eq!(client.identity_exists(&id), false);

    client.register_identity(&id, &pub_key, &user_addr, &attr_hash);

    assert_eq!(client.identity_exists(&id), true);
    assert_eq!(client.get_identity_count(), 1);

    let record = client.get_identity(&id).unwrap();
    assert_eq!(record.id, id);
    assert_eq!(record.stellar_address, user_addr);
    assert_eq!(record.public_key, pub_key);
    assert_eq!(record.attributes_hash, attr_hash);
    assert_eq!(record.verifications.len(), 0);

    let by_pub = client.get_identity_by_public_key(&pub_key).unwrap();
    assert_eq!(by_pub.id, id);
}

#[test]
fn test_duplicate_registration_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let user_addr = Address::generate(&env);
    let id = String::from_str(&env, "did:stellar:user_duplicate");
    let pub_key = BytesN::from_array(&env, &[1u8; 65]);
    let attr_hash = BytesN::from_array(&env, &[2u8; 32]);

    client.register_identity(&id, &pub_key, &user_addr, &attr_hash);
    let res = client.try_register_identity(&id, &pub_key, &user_addr, &attr_hash);
    assert_eq!(res.is_err(), true);
}

#[test]
fn test_update_attributes() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let user_addr = Address::generate(&env);
    let id = String::from_str(&env, "did:stellar:user_update");
    let pub_key = BytesN::from_array(&env, &[3u8; 65]);
    let attr_hash_1 = BytesN::from_array(&env, &[4u8; 32]);
    let attr_hash_2 = BytesN::from_array(&env, &[5u8; 32]);

    client.register_identity(&id, &pub_key, &user_addr, &attr_hash_1);
    client.update_attributes(&id, &attr_hash_2);

    let record = client.get_identity(&id).unwrap();
    assert_eq!(record.attributes_hash, attr_hash_2);
}

#[test]
fn test_add_and_revoke_verification() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let user_addr = Address::generate(&env);
    let verifier = Address::generate(&env);
    let id = String::from_str(&env, "did:stellar:verified_user");
    let pub_key = BytesN::from_array(&env, &[9u8; 65]);
    let attr_hash = BytesN::from_array(&env, &[9u8; 32]);

    client.register_identity(&id, &pub_key, &user_addr, &attr_hash);

    let ver_id = String::from_str(&env, "ver_email_001");
    let attr_id = String::from_str(&env, "email");
    let method = Symbol::new(&env, "passkey");
    let proof = Bytes::from_slice(&env, b"sig_over_email");

    client.add_verification(
        &id,
        &ver_id,
        &attr_id,
        &verifier,
        &method,
        &proof,
        &Option::None,
    );

    let record = client.get_identity(&id).unwrap();
    assert_eq!(record.verifications.len(), 1);
    let v = record.verifications.get(0).unwrap();
    assert_eq!(v.id, ver_id);
    assert_eq!(v.attribute_id, attr_id);
    assert_eq!(v.verifier, verifier);

    // Revoke verification
    client.revoke_verification(&id, &ver_id, &verifier);
    let record_after = client.get_identity(&id).unwrap();
    assert_eq!(record_after.verifications.len(), 0);
}

#[test]
fn test_pause_guard() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    client.pause();
    assert_eq!(client.is_paused(), true);

    let user_addr = Address::generate(&env);
    let id = String::from_str(&env, "did:stellar:paused_test");
    let pub_key = BytesN::from_array(&env, &[6u8; 65]);
    let attr_hash = BytesN::from_array(&env, &[6u8; 32]);

    let res = client.try_register_identity(&id, &pub_key, &user_addr, &attr_hash);
    assert_eq!(res.is_err(), true);

    client.unpause();
    assert_eq!(client.is_paused(), false);

    client.register_identity(&id, &pub_key, &user_addr, &attr_hash);
    assert_eq!(client.identity_exists(&id), true);
}
