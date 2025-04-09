INSERT INTO onchain.dao (dao_chain_id, dao_address, dao_name, proposal_templates_cid, snapshot_ens, sub_dao_of, top_hat_id, hat_id_to_stream_id, gas_tank_enabled, gas_tank_address, required_signatures, guard_address, fractal_module_address, created_at, updated_at) VALUES (8453, '0x07a281d9cf79585282a2ada24b78b494977dc33e', 'decent-api', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '0x0000000000000000000000000000000000000000', NULL, 1744234225, NULL);

INSERT INTO onchain.signer_to_dao (std_signer_address, std_dao_chain_id, std_dao_address) VALUES ('0xd0cbdf4b48d3abc9cc3df373ed2f0f91a38c954c', 8453, '0x07a281d9cf79585282a2ada24b78b494977dc33e');

INSERT INTO onchain.governance_module (governance_module_address, dao_chain_id, dao_address, governance_module_name, governance_module_description) VALUES ('0xd0cbdf4b48d3abc9cc3df373ed2f0f91a38c954c', 8453, '0x07a281d9cf79585282a2ada24b78b494977dc33e', NULL, NULL);

INSERT INTO onchain.voting_strategy (voting_strategy_address, governance_module_id, min_proposer_balance, voting_strategy_name, voting_strategy_description, voting_strategy_enabled_at, voting_strategy_disabled_at) VALUES ('0xe6d3d6c70f22459a98985a998f1a1ddf0949e0d0', '0xd0cbdf4b48d3abc9cc3df373ed2f0f91a38c954c', '1', NULL, NULL, NULL, NULL);

INSERT INTO onchain.voting_token (voting_token_address, voting_strategy_id, type) VALUES ('0x4e885bf7370499074ef59df80be1f97b590066e2', '0xe6d3d6c70f22459a98985a998f1a1ddf0949e0d0', 'ERC20');
