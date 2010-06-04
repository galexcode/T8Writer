default_run_options[:pty] = true

set :user, 'jacobson'
set :domain, 'steinberger.dreamhost.com'
set :project, 'T8Writer'
set :application, 'writer.twelve8.net'
set :applicationdir, "/home/#{user}/#{application}  "

set :repository,  "http://github.com/kjacobson/T8Writer.git"

set :deploy_to, applicationdir
set :deploy_via, :export
set :scm, 'git'
#set :scm_command, "~/packages/bin/git"
#set :local_scm_command, "/opt/local/bin/git"
set :branch, 'master'
set :git_shallow_clone, 1
set :scm_verbose, true
set :use_sudo, false

server domain, :app, :web
role :db, domain, :primary => true

#role :web, "Apache/etc"                          			# Your HTTP server, Apache/etc
#role :app, "Apache/etc"                          # This may be the same as your `Web` server
#role :db,  "your primary db-server here", :primary => true # This is where Rails migrations will run
#role :db,  "your slave db-server here"

# If you are using Passenger mod_rails uncomment this:
# if you're still using the script/reapear helper you will need
# these http://github.com/rails/irs_process_scripts

 namespace :deploy do
   task :start do ; end
   task :stop do ; end
   task :restart, :roles => :app, :except => { :no_release => true } do
     run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
   end
 end