class AddContentsToDocuments < ActiveRecord::Migration
  def self.up
    add_column :documents, :contents, :text
  end

  def self.down
    remove_column :documents, :contents
  end
end
