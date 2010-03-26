# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_writer_session',
  :secret      => 'f4eeb188fa598fe465176144b53b4128881ef1b2b127de1512963a6764d8932c4021ea1a3f807f9f4de446cf9e5036ce13c564533dc348c5934539cfe181fc11'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
