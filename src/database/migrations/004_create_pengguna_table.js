exports.up = function(knex) {
  return knex.schema.createTable('pengguna', (table) => {
    table.increments('id').primary();
    table.string('nama_lengkap', 100).notNullable();
    table.string('email', 100).notNullable().unique();
    table.string('password', 255).notNullable();
    table.integer('role_id').references('id').inTable('roles');
    table.integer('instansi_id').references('id').inTable('instansi').onDelete('SET NULL');
    table.string('nip', 50).unique();
    table.string('jabatan', 100);
    table.string('no_telp', 20);
    table.string('foto');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    table.string('refresh_token', 500);
    table.string('reset_password_token', 500);
    table.timestamp('reset_password_expires');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengguna');
};
