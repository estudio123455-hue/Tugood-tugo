-- migrations/001_add_avatar_url_to_usuarios.sql
ALTER TABLE usuarios ADD COLUMN avatar_url TEXT;
