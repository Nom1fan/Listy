-- gen_random_uuid() is built-in in PostgreSQL 13+; in 12 and older enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users: email and/or phone; at least one required
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    locale VARCHAR(10) DEFAULT 'he',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT at_least_one_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Phone OTP for verification (short-lived)
CREATE TABLE phone_otp (
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (phone)
);

-- Lists
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lists_owner ON lists(owner_id);

-- List members (sharing)
CREATE TABLE list_members (
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'editor'))
);

CREATE INDEX idx_list_members_user ON list_members(user_id);

-- Categories (product bank)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_he VARCHAR(255) NOT NULL,
    icon_id VARCHAR(50),
    image_url VARCHAR(2048),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products (product bank)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_he VARCHAR(255) NOT NULL,
    default_unit VARCHAR(50) DEFAULT 'יחידה',
    image_url VARCHAR(2048),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);

-- List items (items on a list; product_id null = custom/free-text item)
CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    custom_name_he VARCHAR(255),
    quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'יחידה',
    note TEXT,
    crossed_off BOOLEAN NOT NULL DEFAULT FALSE,
    item_image_url VARCHAR(2048),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT name_from_product_or_custom CHECK (
        (product_id IS NOT NULL AND custom_name_he IS NULL) OR
        (product_id IS NULL AND custom_name_he IS NOT NULL)
    )
);

CREATE INDEX idx_list_items_list ON list_items(list_id);

-- FCM tokens for push notifications (Android)
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    device_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, device_id)
);

CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);
