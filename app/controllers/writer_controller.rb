class WriterController < ApplicationController
	def show
		if !params[:key].nil?
			@user = User.find(:first, :conditons => ["key = ?", params[:key]])
			render
		end
	end

	def new
		require 'digest/md5'
		def generate_key
			o =  [('a'..'z'),('A'..'Z')].map{|i| i.to_a}.flatten;
			string  =  (0..16).map{ o[rand(o.length)]  }.join;

			md5 = Digest::MD5.hexdigest(string)
			md5.to_s
			return md5
		end

		md5 = generate_key
		while (!User.find(:first, :conditons => ["key = ?", md5]).nil?)
			md5 = generate_key
		end
		respond_to do |format|
			format.html { render :template => 'writer/new.html.erb' }
		end
	end
end
