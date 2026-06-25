-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "floor_count" INTEGER NOT NULL DEFAULT 1,
    "is_open" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "zones_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building_id" TEXT NOT NULL,
    "zone_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rooms_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFF',
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "power_watts" REAL NOT NULL DEFAULT 0,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equipment_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hvac_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zone_id" TEXT,
    "room_id" TEXT,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'AUTO',
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "set_temperature" REAL NOT NULL DEFAULT 21.0,
    "current_temperature" REAL NOT NULL DEFAULT 20.0,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "power_watts" REAL,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hvac_units_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hvac_units_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "street_lights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building_id" TEXT,
    "identifier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ON',
    "mode" TEXT NOT NULL DEFAULT 'AUTO',
    "power_watts" REAL NOT NULL DEFAULT 100,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "street_lights_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT,
    "hvac_unit_id" TEXT,
    "building_id" TEXT,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sensor_readings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sensor_readings_hvac_unit_id_fkey" FOREIGN KEY ("hvac_unit_id") REFERENCES "hvac_units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sensor_readings_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "room_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "resolved_at" DATETIME,
    CONSTRAINT "incidents_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rfid_readers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "security_level" TEXT NOT NULL DEFAULT 'STANDARD',
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowed_roles" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "access_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "block_index" INTEGER NOT NULL,
    "badge_number" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "holder_role" TEXT NOT NULL,
    "reader_id" TEXT NOT NULL,
    "reader_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "block_hash" TEXT NOT NULL,
    "prev_hash" TEXT NOT NULL,
    "block_data" TEXT NOT NULL,
    CONSTRAINT "access_events_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "rfid_readers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "street_lights_identifier_key" ON "street_lights"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "access_events_block_index_key" ON "access_events"("block_index");
