exports.up = function(knex) {
  return knex.schema.createTable('kategori', (table) => {
    table.increments('id').primary();
    table.string('nama', 100).notNullable();
    table.string('kode', 20).notNullable().unique();
    table.string('deskripsi', 255);
    table.integer('parent_id').references('id').inTable('kategori').onDelete('SET NULL');
    table.integer('level').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('kategori');
};
