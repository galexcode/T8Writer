class DocumentsController < ApplicationController
  #require 'rubygems'
  #require 'sanitize'
  
  # GET /documents
  # GET /documents.xml
  def index
    @documents = Document.all

    respond_to do |format|
      format.html { render :partial => "/documents/new.html.erb", :locals => {:documents => @documents}}
      format.xml  { render :xml => @documents }
    end
  end

  # GET /documents/1
  # GET /documents/1.xml
  def show
    @document = Document.find(:first, :conditions => ["id = ?", params[:id]])

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @document }
    end
  end

  # GET /documents/new
  # GET /documents/new.xml
  def new
    @document = Document.new

    respond_to do |format|
      format.js {
        @document.user_id = params[:user_id] if params[:user_id]
        @document.title = params[:title] if params[:title]
        if @document.save
          render :js => "(function(){T8Writer.Core.createDocument.success(#{@document.id},'#{@document.title}');})();"
        else
          render :js => "(function(){T8Writer.Core.createDocument.errors('#{@document.errors}','#{@document.title}');})();"
        end
      }
      format.html # new.html.erb
      format.xml  { render :xml => @document }
    end
  end

  # GET /documents/1/edit
  def edit
    @document = Document.find(:first, :conditions => ["id = ?", params[:id]])
		@contents = !@document.contents.nil? ? @document.contents.gsub('&lt;br&gt;','<br>') : @document.contents
    respond_to do |format|
      format.html # edit.html.erb
      format.js { render :template => "/documents/edit.js.erb" }
    end
  end

  # POST /documents
  # POST /documents.xml
  def create
    @document = Document.new(params[:document])

    respond_to do |format|
      if @document.save
        flash[:notice] = 'Document was successfully created.'
        #format.html { redirect_to(@document) }
        format.xml  { render :xml => @document, :status => :created, :location => @document }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @document.errors, :status => :unprocessable_entity }
      end
    end
  end

  def save
    @document = Document.find(:first, :conditions => ["id = ?", params[:id]])
    respond_to do |format|
	  new_doc = {:title => params[:document][:title], :contents => params[:document][:contents].gsub('<br>','&lt;br&gt;')}
      if @document.update_attributes(new_doc)
        format.js { render :js => "(function(){T8Writer.current_document.save.success();})();" }
      else
        format.js { render :js => "(function(){T8Writer.current_document.save.errors('#{@document.errors})';})();" }
      end

    end
  end
  # PUT /documents/1
  # PUT /documents/1.xml
  def update
    @document = Document.find(:first, :conditions => ["id = ?", params[:id]])

    respond_to do |format|
      if @document.update_attributes(params[:document])
        flash[:notice] = 'Document was successfully updated.'
        format.html { redirect_to(@document) }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @document.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /documents/1
  # DELETE /documents/1.xml
  def destroy
    @document = Document.find(:first, :conditions => ["id = ?", params[:id]])
    @document.destroy

    respond_to do |format|
      format.html { redirect_to(documents_url) }
      format.xml  { head :ok }
    end
  end
end
