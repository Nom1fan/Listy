--
-- PostgreSQL database dump
--

\restrict co6jpKsDUN3venfbVZoL7iMpQZAcf9H38gBJo87mdXyV7Eje4Ur3iQWziTgcT0Q

-- Dumped from database version 11.0 (Debian 11.0-1.pgdg90+2)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name_he character varying(255) NOT NULL,
    icon_id character varying(50),
    image_url character varying(2048),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fcm_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fcm_tokens (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(512) NOT NULL,
    device_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: list_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.list_items (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    product_id uuid,
    custom_name_he character varying(255),
    quantity numeric(12,3) DEFAULT 1 NOT NULL,
    unit character varying(50) DEFAULT 'יחידה'::character varying,
    note text,
    crossed_off boolean DEFAULT false NOT NULL,
    item_image_url character varying(2048),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    icon_id character varying(64),
    CONSTRAINT name_from_product_or_custom CHECK ((((product_id IS NOT NULL) AND (custom_name_he IS NULL)) OR ((product_id IS NULL) AND (custom_name_he IS NOT NULL))))
);


--
-- Name: list_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.list_members (
    list_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'editor'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'editor'::character varying])::text[])))
);


--
-- Name: lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: otp_request_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_request_log (
    phone character varying(20) NOT NULL,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id bigint NOT NULL
);


--
-- Name: otp_request_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otp_request_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otp_request_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otp_request_log_id_seq OWNED BY public.otp_request_log.id;


--
-- Name: phone_otp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_otp (
    phone character varying(20) NOT NULL,
    code character varying(10) NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name_he character varying(255) NOT NULL,
    default_unit character varying(50) DEFAULT 'יחידה'::character varying,
    image_url character varying(2048),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    icon_id character varying(64)
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    email character varying(255),
    phone character varying(20),
    password_hash character varying(255),
    display_name character varying(255),
    locale character varying(10) DEFAULT 'he'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT at_least_one_identifier CHECK (((email IS NOT NULL) OR (phone IS NOT NULL)))
);


--
-- Name: otp_request_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_request_log ALTER COLUMN id SET DEFAULT nextval('public.otp_request_log_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name_he, icon_id, image_url, sort_order, created_at) FROM stdin;
a0000002-0000-0000-0000-000000000002	לחם ומאפים	bread	\N	2	2026-02-11 21:01:48.965446+00
a0000003-0000-0000-0000-000000000003	ירקות	vegetables	\N	3	2026-02-11 21:01:48.965446+00
a0000004-0000-0000-0000-000000000004	פירות	fruits	\N	4	2026-02-11 21:01:48.965446+00
a0000005-0000-0000-0000-000000000005	בשר ועוף	meat	\N	5	2026-02-11 21:01:48.965446+00
a0000006-0000-0000-0000-000000000006	מכולת	groceries	\N	6	2026-02-11 21:01:48.965446+00
e1ae9f50-531b-4c34-8b1e-e5d24c7396f1	תחליפי בשר	meat	\N	5	2026-02-11 21:49:04.109169+00
0e3c4192-d471-4e27-83b2-719d7622f947	ניקיון	fruits	https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-18/256/2771.png	6	2026-02-12 04:43:02.874273+00
\.


--
-- Data for Name: fcm_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fcm_tokens (id, user_id, token, device_id, created_at) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	initial schema	SQL	V1__initial_schema.sql	-1744624308	postgres	2026-02-11 23:01:48.887618	50	t
2	2	otp rate limit	SQL	V2__otp_rate_limit.sql	-1947017794	postgres	2026-02-11 23:01:48.952553	3	t
3	3	seed categories and products	SQL	V3__seed_categories_and_products.sql	-464406046	postgres	2026-02-11 23:01:48.962589	3	t
4	4	add otp request log id	SQL	V4__add_otp_request_log_id.sql	-2088068735	postgres	2026-02-11 23:06:21.168429	25	t
5	5	add product icon id	SQL	V5__add_product_icon_id.sql	-452788278	postgres	2026-02-12 07:49:49.263892	7	t
6	6	add list item icon id	SQL	V6__add_list_item_icon_id.sql	1365331976	postgres	2026-02-12 11:34:48.117806	6	t
\.


--
-- Data for Name: list_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.list_items (id, list_id, product_id, custom_name_he, quantity, unit, note, crossed_off, item_image_url, sort_order, created_at, updated_at, icon_id) FROM stdin;
5e041cf5-f601-4114-8c3b-92c6cf09b990	b967eaf3-c307-405a-a61a-ff5b1341a478	b000000d-0000-0000-0000-00000000000d	\N	1.000	יחידה	\N	f	\N	0	2026-02-12 05:06:54.490916+00	2026-02-12 05:06:54.490919+00	\N
9aff410b-afbc-46a2-85c7-461a6cf94a58	b967eaf3-c307-405a-a61a-ff5b1341a478	b0000009-0000-0000-0000-000000000009	\N	1.000	יחידה	\N	f	\N	0	2026-02-12 05:07:44.176919+00	2026-02-12 05:07:44.176925+00	\N
526adb72-4252-49fc-acdb-acdde88017dd	b967eaf3-c307-405a-a61a-ff5b1341a478	c0a87c32-b0dd-4644-a657-65a46ac88665	\N	1.000	יחידה	רק של Kikkoman	f	https://d3m9l0v76dty0.cloudfront.net/system/photos/5094742/large/ca1f052b134edb1f68dc67bfc86ad6a3.jpg	0	2026-02-12 04:45:53.609523+00	2026-02-12 05:43:49.13446+00	\N
2445b628-9d0d-4312-acd2-91caf713019a	bca09daf-bdc5-402f-b095-21aae66cf9f6	\N	כיסא עץ	6.000	יחידה	\N	f	https://images.unsplash.com/photo-1730373451883-45a448eb9bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NzI5Njh8MHwxfHNlYXJjaHw2fHx3b29kZW4lMjBjaGFpcnxlbnwwfHx8fDE3NzA4ODk3NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080	0	2026-02-12 09:49:43.269403+00	2026-02-12 12:13:25.884753+00	\N
0eed67f0-3f09-4eaf-9e36-f9befe68140e	bca09daf-bdc5-402f-b095-21aae66cf9f6	\N	מתקן למטריות	1.000	יחידה	\N	f	https://images.unsplash.com/photo-1532135468830-e51699205b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NzI5Njh8MHwxfHNlYXJjaHwzfHx1bWJyZWxsYXxlbnwwfHx8fDE3NzA4OTg1MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080	0	2026-02-12 12:15:36.271635+00	2026-02-12 12:15:36.27164+00	\N
\.


--
-- Data for Name: list_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.list_members (list_id, user_id, role, created_at) FROM stdin;
b967eaf3-c307-405a-a61a-ff5b1341a478	f9490ba3-2bce-4a6d-8d3c-941c3bb9b265	owner	2026-02-11 21:17:16.707408+00
bca09daf-bdc5-402f-b095-21aae66cf9f6	f9490ba3-2bce-4a6d-8d3c-941c3bb9b265	owner	2026-02-12 09:26:23.711769+00
bca09daf-bdc5-402f-b095-21aae66cf9f6	7b6632ee-2d56-4e76-9d9d-1cb4914b7bd4	editor	2026-02-12 12:13:47.740282+00
\.


--
-- Data for Name: lists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lists (id, name, owner_id, created_at, updated_at) FROM stdin;
b967eaf3-c307-405a-a61a-ff5b1341a478	קניות	f9490ba3-2bce-4a6d-8d3c-941c3bb9b265	2026-02-11 21:17:16.705688+00	2026-02-11 21:17:16.705692+00
bca09daf-bdc5-402f-b095-21aae66cf9f6	איקאה	f9490ba3-2bce-4a6d-8d3c-941c3bb9b265	2026-02-12 09:26:23.705763+00	2026-02-12 09:26:23.705773+00
\.


--
-- Data for Name: otp_request_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otp_request_log (phone, requested_at, id) FROM stdin;
+972542258808	2026-02-11 21:15:06.742254+00	1
+972542258808	2026-02-11 21:16:55.997555+00	2
+972542258808	2026-02-12 04:38:10.732756+00	3
+972549966847	2026-02-12 05:34:51.676302+00	4
+972549966847	2026-02-12 05:39:31.084337+00	5
+972542258808	2026-02-12 05:39:52.38755+00	6
+972542258808	2026-02-12 08:00:28.036959+00	7
+972542258808	2026-02-12 08:01:04.854411+00	8
+972542258808	2026-02-12 09:24:35.419449+00	9
+972549966847	2026-02-12 09:50:55.349364+00	10
+972542258808	2026-02-12 12:13:09.849527+00	11
+972549966847	2026-02-12 12:14:43.165795+00	12
\.


--
-- Data for Name: phone_otp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phone_otp (phone, code, expires_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, category_id, name_he, default_unit, image_url, created_at, icon_id) FROM stdin;
b0000005-0000-0000-0000-000000000005	a0000002-0000-0000-0000-000000000002	לחם	כיכר	\N	2026-02-11 21:01:48.965446+00	\N
b000000a-0000-0000-0000-00000000000a	a0000003-0000-0000-0000-000000000003	חסה	יחידה	\N	2026-02-11 21:01:48.965446+00	\N
b000000c-0000-0000-0000-00000000000c	a0000004-0000-0000-0000-000000000004	תפוח	יחידה	\N	2026-02-11 21:01:48.965446+00	\N
b000000f-0000-0000-0000-00000000000f	a0000004-0000-0000-0000-000000000004	אבטיח	יחידה	\N	2026-02-11 21:01:48.965446+00	\N
b0000011-0000-0000-0000-000000000011	a0000006-0000-0000-0000-000000000006	פסטה	חבילה	\N	2026-02-11 21:01:48.965446+00	\N
b0000012-0000-0000-0000-000000000012	a0000006-0000-0000-0000-000000000006	שמן	בקבוק	\N	2026-02-11 21:01:48.965446+00	\N
b0000013-0000-0000-0000-000000000013	a0000006-0000-0000-0000-000000000006	מלח	יחידה	\N	2026-02-11 21:01:48.965446+00	\N
b0000008-0000-0000-0000-000000000008	a0000003-0000-0000-0000-000000000003	מלפפון	יחידה	https://images.emojiterra.com/google/android-11/512px/1f952.png	2026-02-11 21:01:48.965446+00	\N
b000000e-0000-0000-0000-00000000000e	a0000004-0000-0000-0000-000000000004	תפוז	יחידה	https://images.emojiterra.com/microsoft/fluent-emoji/15.1/512px/1f34a_color.png	2026-02-11 21:01:48.965446+00	\N
906c86b2-053f-4f3a-a2a0-5a8d1e28ca01	a0000003-0000-0000-0000-000000000003	קישוא	יחידה	https://cdn-icons-png.flaticon.com/512/3944/3944047.png	2026-02-11 21:49:31.696254+00	\N
7509365b-36b7-4dd0-a8f4-7466dcab4b8f	a0000004-0000-0000-0000-000000000004	פומלה	יחידה	\N	2026-02-12 04:45:00.094435+00	\N
4ba9c2aa-2cc8-4783-8be1-d0a495626413	a0000004-0000-0000-0000-000000000004	פומלית	יחידה	\N	2026-02-12 04:45:03.783863+00	\N
c0a87c32-b0dd-4644-a657-65a46ac88665	a0000006-0000-0000-0000-000000000006	רוטב סויה	יחידה	\N	2026-02-12 04:45:25.957712+00	\N
b0000010-0000-0000-0000-000000000010	a0000006-0000-0000-0000-000000000006	אורז	קילו	https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/icw3k5e0dqvcj9seryeahq0e0sfl	2026-02-11 21:01:48.965446+00	\N
b000000d-0000-0000-0000-00000000000d	a0000004-0000-0000-0000-000000000004	בננה	יחידה	https://images.emojiterra.com/google/noto-emoji/unicode-16.0/color/512px/1f34c.png	2026-02-11 21:01:48.965446+00	\N
b0000009-0000-0000-0000-000000000009	a0000003-0000-0000-0000-000000000003	גזר	יחידה	\N	2026-02-11 21:01:48.965446+00	carrot
b000000b-0000-0000-0000-00000000000b	a0000003-0000-0000-0000-000000000003	בצל	קילו	\N	2026-02-11 21:01:48.965446+00	onion
b0000006-0000-0000-0000-000000000006	a0000002-0000-0000-0000-000000000002	פיתות	חבילה	/uploads/product/08128529-a371-4df4-a154-360b4829f8a9.png	2026-02-11 21:01:48.965446+00	\N
b0000007-0000-0000-0000-000000000007	a0000003-0000-0000-0000-000000000003	עגבניה	יחידה	\N	2026-02-11 21:01:48.965446+00	tomato
7dfce2ec-e86b-4126-8f90-024c788c00a4	a0000003-0000-0000-0000-000000000003	פלפל אדום	3	https://em-content.zobj.net/source/facebook/304/bell-pepper_1fad1.png	2026-02-12 08:04:16.487542+00	\N
7de5e174-134a-4b74-872e-8ce1661043b5	a0000003-0000-0000-0000-000000000003	פלפל צהוב	3	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW-dQZB2kSyEz9s-VTVWj9YPKqZfucyzEi8w&s	2026-02-12 08:09:09.581874+00	\N
9dca8572-3f34-49bc-99d6-5bd11d6f00e4	a0000003-0000-0000-0000-000000000003	בצל סגול	קילו	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXVvbvQX51MeVH4v-AosF50CL2KsNLSHri7g&s	2026-02-12 08:10:11.300062+00	\N
7f52efb5-bf24-4337-b432-d0b13919cfed	a0000003-0000-0000-0000-000000000003	בטטה	קילו	\N	2026-02-12 08:23:25.578952+00	yam
4217770e-34d3-4afa-a8c6-c8e5c5eab2cb	a0000003-0000-0000-0000-000000000003	ברוקולי	קילו	\N	2026-02-12 08:23:48.542632+00	broccoli
e41e463f-b762-4b8a-a426-8bf01c0aa477	a0000003-0000-0000-0000-000000000003	פיטרוזיליה	יחידה	\N	2026-02-12 08:24:12.853384+00	leaf
5be797ba-b12c-4448-99a3-d6c4f2a8f603	a0000003-0000-0000-0000-000000000003	שמיר	יחידה	\N	2026-02-12 08:24:29.886638+00	leaf
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, phone, password_hash, display_name, locale, created_at, updated_at) FROM stdin;
f9490ba3-2bce-4a6d-8d3c-941c3bb9b265	\N	+972542258808	\N	מור	he	2026-02-11 21:17:06.775686+00	2026-02-11 21:38:47.254348+00
7b6632ee-2d56-4e76-9d9d-1cb4914b7bd4	\N	+972549966847	\N	במבי	he	2026-02-12 05:39:35.598677+00	2026-02-12 05:39:42.941288+00
\.


--
-- Name: otp_request_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otp_request_log_id_seq', 12, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: fcm_tokens fcm_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_pkey PRIMARY KEY (id);


--
-- Name: fcm_tokens fcm_tokens_user_id_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_user_id_device_id_key UNIQUE (user_id, device_id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: list_items list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT list_items_pkey PRIMARY KEY (id);


--
-- Name: list_members list_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_members
    ADD CONSTRAINT list_members_pkey PRIMARY KEY (list_id, user_id);


--
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- Name: otp_request_log otp_request_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_request_log
    ADD CONSTRAINT otp_request_log_pkey PRIMARY KEY (id);


--
-- Name: phone_otp phone_otp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_otp
    ADD CONSTRAINT phone_otp_pkey PRIMARY KEY (phone);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_fcm_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fcm_tokens_user ON public.fcm_tokens USING btree (user_id);


--
-- Name: idx_list_items_list; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_list_items_list ON public.list_items USING btree (list_id);


--
-- Name: idx_list_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_list_members_user ON public.list_members USING btree (user_id);


--
-- Name: idx_lists_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_owner ON public.lists USING btree (owner_id);


--
-- Name: idx_otp_request_log_phone_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otp_request_log_phone_time ON public.otp_request_log USING btree (phone, requested_at);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: fcm_tokens fcm_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: list_items list_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: list_items list_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT list_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: list_members list_members_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_members
    ADD CONSTRAINT list_members_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: list_members list_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_members
    ADD CONSTRAINT list_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lists lists_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict co6jpKsDUN3venfbVZoL7iMpQZAcf9H38gBJo87mdXyV7Eje4Ur3iQWziTgcT0Q

