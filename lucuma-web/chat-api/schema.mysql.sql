CREATE TABLE lucuma_chat_conversations (
  id CHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  kind ENUM('direct','group') NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_conv_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lucuma_chat_members (
  conversation_id CHAR(32) NOT NULL,
  user_id CHAR(36) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hidden_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (conversation_id,user_id),
  INDEX idx_chat_member_user (user_id),
  CONSTRAINT fk_chat_member_conversation FOREIGN KEY (conversation_id)
    REFERENCES lucuma_chat_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lucuma_chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id CHAR(32) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL DEFAULT NULL,
  deleted_for_everyone_at TIMESTAMP NULL DEFAULT NULL,
  deleted_by CHAR(36) NULL DEFAULT NULL,
  INDEX idx_chat_messages_conversation (conversation_id,id),
  CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id)
    REFERENCES lucuma_chat_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profile display names are fetched from Supabase only for identity/authentication;
-- conversation metadata and message bodies are stored in this MySQL database.

CREATE TABLE lucuma_chat_profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NULL,
  email VARCHAR(254) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Per-user message deletion: the message remains visible to other participants.
CREATE TABLE lucuma_chat_message_deletions (
  message_id BIGINT UNSIGNED NOT NULL,
  user_id CHAR(36) NOT NULL,
  deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  INDEX idx_chat_message_deletions_user (user_id),
  CONSTRAINT fk_chat_message_deletion_message
    FOREIGN KEY (message_id) REFERENCES lucuma_chat_messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
