CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
    wallet_id SERIAL PRIMARY KEY,
    github_user_id BIGINT NOT NULL,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    FOREIGN KEY (github_user_id) REFERENCES github_users(id)
    ON DELETE CASCADE
);