%lang starknet

@contract
namespace PaymentProof {
    struct Payment {
        sender: felt252,
        receiver: felt252,
        amount: felt252,
        proof_hash: felt252,
        timestamp: felt252,
    }

    @storage_var
    func payments(sender: felt252, receiver: felt252) -> Payment {}

    @external
    func store_payment(
        sender: felt252, receiver: felt252, amount: felt252, proof_hash: felt252
    ) {
        let ts = get_block_timestamp();
        payments.write(sender, receiver, Payment(sender, receiver, amount, proof_hash, ts));
    }

    @view
    func get_payment(sender: felt252, receiver: felt252) -> Payment {
        return payments.read(sender, receiver);
    }
}


