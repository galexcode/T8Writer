class WriterController < ApplicationController
  def show
    if !params[:key].nil?
      @user = User.find_by_key(params[:key])
      @docs = Document.find_all_by_user_id(@user.id)
      render
    end
  end
end
