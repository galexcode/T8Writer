class AddPrimaryKeys < ActiveRecord::Migration
  def self.up
    add_index :users, :id, :unique => true
    add_index :documents, :id, :unique => true
  end

  def self.down
    remove_index :documents, :id
    remove_index :users, :id
  end
end
