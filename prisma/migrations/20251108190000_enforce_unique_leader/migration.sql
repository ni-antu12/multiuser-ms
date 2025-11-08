-- Add unique constraints to enforce un solo grupo por líder y tokens únicos

CREATE UNIQUE INDEX "family_groups_leader_key" ON "family_groups"("leader");

CREATE UNIQUE INDEX "family_groups_token_app_key" ON "family_groups"("token_app");

