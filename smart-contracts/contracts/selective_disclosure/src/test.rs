#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Bytes, BytesN, Env, String, Symbol, Vec,
};

fn setup_contract(env: &Env) -> (SelectiveDisclosureContractClient<'_>, Address) {
    let contract_id = env.register_contract(None, SelectiveDisclosureContract);
    let client = SelectiveDisclosureContractClient::new(env, &contract_id);
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
}

#[test]
fn test_create_and_respond_request() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let requester = Address::generate(&env);
    let responder = Address::generate(&env);

    let req_id = String::from_str(&env, "req_1001");
    let purpose = String::from_str(&env, "Employment background verification");
    let mut attrs = Vec::new(&env);
    attrs.push_back(Symbol::new(&env, "email"));
    attrs.push_back(Symbol::new(&env, "dob"));

    let expires_at = env.ledger().timestamp() + 3600;

    client.create_request(&req_id, &requester, &attrs, &purpose, &expires_at);

    let req = client.get_request(&req_id).unwrap();
    assert_eq!(req.id, req_id);
    assert_eq!(req.requester, requester);
    assert_eq!(req.requested_attributes.len(), 2);

    assert_eq!(client.has_valid_response(&req_id), false);

    // Respond with cryptographic commitment
    let id_id = String::from_str(&env, "did:stellar:user_456");
    let commitment = BytesN::from_array(&env, &[11u8; 32]);
    let proof = Bytes::from_slice(&env, b"zk_membership_proof_bytes");
    let mut disclosed = Vec::new(&env);
    disclosed.push_back(Symbol::new(&env, "email"));

    client.respond_to_request(
        &req_id,
        &id_id,
        &responder,
        &commitment,
        &proof,
        &disclosed,
    );

    assert_eq!(client.has_valid_response(&req_id), true);
    let resp = client.get_response(&req_id).unwrap();
    assert_eq!(resp.request_id, req_id);
    assert_eq!(resp.identity_id, id_id);
    assert_eq!(resp.commitment_root, commitment);
    assert_eq!(resp.revoked, false);

    // Revoke response
    let reason = String::from_str(&env, "User withdrawn consent");
    client.revoke_response(&req_id, &responder, &reason);

    assert_eq!(client.has_valid_response(&req_id), false);
    let revoked_resp = client.get_response(&req_id).unwrap();
    assert_eq!(revoked_resp.revoked, true);
}

#[test]
fn test_expired_request_cannot_be_responded() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup_contract(&env);

    let requester = Address::generate(&env);
    let responder = Address::generate(&env);

    let req_id = String::from_str(&env, "req_expired");
    let purpose = String::from_str(&env, "KYC Check");
    let mut attrs = Vec::new(&env);
    attrs.push_back(Symbol::new(&env, "name"));

    let expires_at = env.ledger().timestamp() + 100;
    client.create_request(&req_id, &requester, &attrs, &purpose, &expires_at);

    // Advance ledger timestamp beyond expiry
    env.ledger().with_mut(|l| {
        l.timestamp += 200;
    });

    let id_id = String::from_str(&env, "did:stellar:user_789");
    let commitment = BytesN::from_array(&env, &[12u8; 32]);
    let proof = Bytes::from_slice(&env, b"proof");
    let mut disclosed = Vec::new(&env);
    disclosed.push_back(Symbol::new(&env, "name"));

    let res = client.try_respond_to_request(
        &req_id,
        &id_id,
        &responder,
        &commitment,
        &proof,
        &disclosed,
    );
    assert_eq!(res.is_err(), true);
}
