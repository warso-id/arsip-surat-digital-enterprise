exports.up = function(knex) {
  return knex.schema.createTable('instansi', (table) => {
    table.increments('id').primary();
    table.string('nama', 200).notNullable();
    table.string('kode', 20).notNullable().unique();
    table.text('alamat');
    table.string('kota', 100);
    table.string('provinsi', 100);
    table.string('kode_pos', 10);
    table.string('no_telp', 20);
    table.string('email', 100);
    table.string('website', 100);
    table.string('logo');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('instansi');
};
