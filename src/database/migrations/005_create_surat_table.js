exports.up = function(knex) {
  return knex.schema.createTable('surat', (table) => {
    table.increments('id').primary();
    table.string('nomor_surat', 100).notNullable();
    table.string('nomor_agenda', 50);
    table.enum('jenis_surat', ['masuk', 'keluar']).notNullable();
    table.string('perihal', 500).notNullable();
    table.date('tanggal_surat').notNullable();
    table.date('tanggal_terima');
    table.string('pengirim', 255);
    table.string('penerima', 255);
    table.integer('kategori_id').references('id').inTable('kategori').onDelete('SET NULL');
    table.integer('instansi_id').references('id').inTable('instansi').onDelete('SET NULL');
    table.enum('sifat_surat', ['biasa', 'segera', 'penting', 'rahasia']).defaultTo('biasa');
    table.enum('status', ['draft', 'proses', 'selesai', 'arsip']).defaultTo('draft');
    table.text('isi_ringkasan');
    table.string('file_path');
    table.integer('file_size');
    table.string('file_type', 50);
    table.string('kode_klasifikasi', 50);
    table.integer('created_by').references('id').inTable('pengguna');
    table.integer('updated_by').references('id').inTable('pengguna');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
    
    // Indexes
    table.index('nomor_surat');
    table.index('jenis_surat');
    table.index('tanggal_surat');
    table.index('status');
    table.index('deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('surat');
};
