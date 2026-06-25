-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 1,
    "program" TEXT NOT NULL,
    CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
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
    "area_sqm" REAL,
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
CREATE TABLE "parking_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "total_spots" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parking_spots_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "parking_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parking_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spot_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parking_reservations_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "parking_spots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "parking_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "street_lights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building_id" TEXT,
    "identifier" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'ON',
    "mode" TEXT NOT NULL DEFAULT 'AUTO',
    "power_watts" REAL NOT NULL DEFAULT 100,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "street_lights_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "description" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    CONSTRAINT "course_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "is_present" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" DATETIME,
    CONSTRAINT "attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "course_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campus_presences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "building_id" TEXT,
    "badge_id" TEXT,
    "checked_in_at" DATETIME NOT NULL,
    "checked_out_at" DATETIME,
    CONSTRAINT "campus_presences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campus_presences_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dorm_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "dorm_assignments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dorm_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "occupancy_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT,
    "zone_id" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occupant_count" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "rate" REAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SENSOR',
    CONSTRAINT "occupancy_records_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "occupancy_records_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "equipment_id" TEXT,
    "street_light_id" TEXT,
    "reported_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "resolution_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "resolved_at" DATETIME,
    CONSTRAINT "incidents_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "incidents_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "incidents_street_light_id_fkey" FOREIGN KEY ("street_light_id") REFERENCES "street_lights" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "incidents_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "incidents_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "badge_id" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_success" BOOLEAN NOT NULL DEFAULT true,
    "ip_address" TEXT,
    "notes" TEXT,
    CONSTRAINT "access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "meta_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "room_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "reserved_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "room_reservations_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "room_reservations_reserved_by_id_fkey" FOREIGN KEY ("reserved_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_lot_id_number_key" ON "parking_spots"("lot_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "street_lights_identifier_key" ON "street_lights"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_session_id_student_id_key" ON "attendances"("session_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "dorm_assignments_student_id_key" ON "dorm_assignments"("student_id");
