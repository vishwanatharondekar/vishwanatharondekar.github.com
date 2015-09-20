$(function(){



	var SearchView = Backbone.View.extend({

		el : $('.searchbarcontainer'),
		events : {
			'click .buttonposition' : 'doSearch'
		},
		initialize : function(){
			this.searched = '';
			this.flickerGallery = null;
		},
		render : function(){

		},
		doSearch : function(){
			var searchQuery = this.$('.inputbox').val();
			if(searchQuery==='' || this.searched===searchQuery ){
				return;
			}

			if(this.flickerGallery){
				this.flickerGallery.reInitialize({query : searchQuery});
				return;
			}



			this.flickerGallery = new FlickerGallery({el:$('.flickergallery'), query : searchQuery});

		}
	});


	var FlickerGallery = Backbone.View.extend({
		initialize : function(options) {
			this.imageCollection = new ImageCollection();
			this.slideShowView = new SlideView({el : $('.slideviewcontainer'), collection : this.imageCollection});
			this.gridView = new GridView({el:$('.gridviewcontainer'), slideShowView : this.slideShowView,  collection : this.imageCollection, query : options.query});
			//this.render(data);
		},
		render : function(data) {
		},
		reInitialize  : function(options){
			this.gridView.update(options);
		}
	});


	var GridView = Backbone.View.extend({
		initialize : function(options) {

			this.query = options.query;
			this.options = $.merge(options, {});
			this.currentPageIndex = 0;

			//I hate doing this, cyclic dependency, coupling
			this.options.slideShowView.options.gridView = this;
			this.gridViewCache = {};
			this.imagesPerPage = 20;
			this.showPage({pageIndex : 0, query : options.query});
			this.show();
		},
		render : function(data) {
		},
		events : {
			'click .showslidebutton' : 'showSlideShow',
			'click img' : 'showSlideShow',
			'click .nextPageButton' : 'showNextPage',
			'click .previousPageButton' : 'showPrevPage',
			'click .pagebutton' : 'showSelectedPage'
		},
		showSelectedPage : function(){
			var selectedPage = this.$('.pageInput').val();
			if(isNaN(selectedPage)){
				return;
			}
			selectedPage = parseInt(selectedPage);
			if(selectedPage<1 || selectedPage>this.totalPages){
				return;
			}
			this.currentPageIndex = selectedPage;
			this.showPage({pageIndex : selectedPage-1});
		},
		showPrevPage : function(event){
			if(this.currentPageIndex===0){
				return;
			}
			this.currentPageIndex = this.currentPageIndex-1;
			this.showPage({pageIndex : this.currentPageIndex});
		},
		showNextPage : function(event){
			this.currentPageIndex = this.currentPageIndex+1;
			this.showPage({pageIndex : this.currentPageIndex});
		},
		showSlideShow : function(){
			this.hide();
			this.options.slideShowView.show();
		},
		show : function(data){
			this.showPage(data);
			//$(this.el).show();
			$(this.el).fadeIn();
		},
		hide : function(){
			//$(this.el).hide();
			$(this.el).fadeOut();
		},
		getPage : function(data){

			var callBack = data?data.callBack : null;
			var pageIndex = data ? data.pageIndex : null;

			var gridView = this;
			this.currentPageIndex = pageIndex;
			this.gridViewCache[this.currentPageIndex] = pageGridViews = [];

			window.jsonFlickrApi = function(response){
			    var gridContainer = gridView.$('.gridcontainer');
			    var photoList = response.photos.photo;
			    var totalResults = response.photos.total;

			    gridView.$('.totalPages').html(response.photos.pages);
			    gridView.totalPages = response.photos.pages;

			    var pageContainer = $('<div>').addClass('page'+pageIndex).addClass('page');
			    gridContainer.append(pageContainer);
			    for(var index=0, photoIndex=index+gridView.currentPageIndex*gridView.imagesPerPage; index<photoList.length;index++, photoIndex++){
			        var photoData = photoList[index];
			        var gridElement = $('<div class=gridelement>');

			        var model = new ImageModel(photoData);
			        model.set('index', photoIndex);

			        console.log('photoIndex');
			        console.log(photoIndex);

			        var gridElementView = new GridElementView({el : gridElement, model : model, 'slideView' : gridView.options.slideShowView});

			        pageContainer.append(gridElement);

			        gridView.gridViewCache[gridView.currentPageIndex][photoIndex] = gridElementView;
			        gridView.collection.add(model);

			        //console.log('gridView');
			        //console.log(gridView);
			    }
			    if(callBack){
			    	callBack();
			    }
			}


			var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=47adbb50cbdd79b35a80868356361172&tags=' + (data.query?data.query:this.query) + '&per_page=20&page=' + (pageIndex + 1) +'&format=json&extras=owner_name,original_format';
			console.log(url);
			$.ajax({
			    type : 'get',
			    url : url,
			    //succes : jsonFlickrApi,
			    jsonp : jsonFlickrApi,
			    //crossDomain : true,
			    dataType: "jsonp"/*,
			    success : function (response){
			    	console.log('response', response);
			        eval(response);
			    }*/

			});
			this.$('.pageno').html(pageIndex+1);
		},
		showPage : function(data) {
			var pageIndex = data ? data.pageIndex : undefined;
			var gridView = this;

			this.$('.page').hide();

			var page = this.$('.page'+pageIndex);
			if(page.length!=0){
				page.show();
				return;
			}

			var pageGridViews = this.gridViewCache[this.currentPageIndex];
			if(!pageGridViews){
				this.getPage(data);
			}

			this.$('.pageno').html(pageIndex+1);
		},
		update : function(options){
			this.query = options.query;
			this.reset();
			this.options.slideShowView.reset();
			this.show({pageIndex : 0, query : options.query})
		},
		reset : function(){
			this.currentPageIndex = 0;
			this.$('.page').remove();
			this.gridViewCache = {};
			this.collection.reset();

		}
	});




	var GridElementView = Backbone.View.extend({
		initialize : function(options) {
			this.options = $.merge(options, {});
			this.render(options.data);
		},
		render : function(data) {
			var photoData = this.model.attributes;

			var imageURL = 'http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_';

			imageURL = imageURL.replace('{farm-id}', photoData.farm);
	        imageURL = imageURL.replace('{id}', photoData.id);
	        imageURL = imageURL.replace('{server-id}', photoData.server);

	        var thumb = imageURL.replace('{secret}', photoData.secret);
	        var original = imageURL.replace('{secret}', photoData.originalsecret);

	        medium = thumb + 'c' + '.jpg';
	        thumb = thumb + 'q' +'.jpg';
	        original = original + 'o' +'.' + photoData.originalformat;



	        this.model.set('thumb', thumb);
	        this.model.set('original', original);
	        this.model.set('medium', medium);

	        var photoTitle = photoData.title;
	        var img = $('<img>').attr({'src':thumb});


	        var linkContainer = $('<div class="infocontainer">');



	        var originalLink = $('<a>').attr('href', original).html('Download Original').css({color:'#FFFFFA'});

	        linkContainer.append(originalLink);


	        $(this.el).append(img);
	        $(this.el).append(linkContainer);
		},
		events : {
			'mouseenter' : 'showImageInfo',
			'mouseleave' : 'hideImageInfo',
			'click img' : 'showSlideShow'
		},
		showImageInfo : function(event){
			this.$('.infocontainer').animate({'bottom':'0px'});
		},
		hideImageInfo : function(){
			this.$('.infocontainer').animate({'bottom':'-50px'});
		},
		showSlideShow : function(){
			this.options.slideView.showSlide(this.model);
		}
	});



	var SlideView = Backbone.View.extend({
		initialize : function(options) {
			this.reset();
		},
		render : function(data) {
		},
		events : {
			'click .showgridbutton' : 'showGridView',
			'click .nextbutton' : 'showNextSlide',
			'click .prevbutton' : 'showPrevSlide'
		},
		showGridView : function(){
			this.hide();
			var pageIndex = parseInt(this.currentSlideIndex/this.options.gridView.imagesPerPage);
			this.options.gridView.show({pageIndex : pageIndex});
		},
		showNextSlide : function(event){

			var slideView = this;
			//TODO : To check for total image counter
			//TODO : To implement pagination
			this.currentSlideIndex = this.currentSlideIndex+1;
			var model = this.collection.at(this.currentSlideIndex);
			//Data present
			if(model){
				this.showSlide(model);
			} else {
				function callBack(){
					slideView.dummy.call(slideView);
				}
				var pageIndex = parseInt(this.currentSlideIndex/this.options.gridView.imagesPerPage);
				this.options.gridView.getPage({pageIndex : pageIndex, callBack : callBack});
				var slideView = this;

			}
		},
		dummy : function(){
			console.log('currentSlideindex in dummy', this.currentSlideIndex);
			var model = this.collection.at(this.currentSlideIndex);
			this.showSlide(model);
		},
		showPrevSlide : function(event){
			this.currentSlideIndex = this.currentSlideIndex-1<=0?0:this.currentSlideIndex-1;
			var model = this.collection.at(this.currentSlideIndex);
			this.showSlide(model);
		},
		showSlide : function(model){
			var index = model.attributes.index;
			//var index = this.currentSlideIndex;
			console.log('index in showSlide', index);

			this.currentSlideIndex = index;
			var cachedSlideElementView = this.slideViewCache[index];


			//View already created
			if(!cachedSlideElementView){
				var slidesContainer = this.$('.slidescontainer');
				var slideContainer = $('<div class=slidecontainer>');
				this.slideViewCache[index] = cachedSlideElementView = new SlideElementView({el:slideContainer, model:model});
				$(slidesContainer).append(slideContainer);
			}

			for ( var index in this.slideViewCache) {
				this.slideViewCache[index].hide();
			}

			cachedSlideElementView.show();

		},
		show : function(){
			if($.isEmptyObject(this.slideViewCache)){
				this.showSlide(this.collection.at(0));
			}
			//$(this.el).show();
			$(this.el).fadeIn();
		},
		hide : function(){
			//$(this.el).hide();
			$(this.el).fadeOut();
		},
		reset : function(){
			this.hide();
			this.slideViewCache = {};
			this.$('.slidecontainer').remove();
			this.currentSlideIndex = 0;
			this.collection.reset();
		}
	});

	var SlideElementView = Backbone.View.extend({
		initialize : function(options) {
			this.render();
		},
		render : function(data) {
			var img = $('<img>').attr({'src':this.model.attributes.medium});
			$(this.el).append(img);
		},
		show : function(){
			//$(this.el).show();
			$(this.el).fadeIn();
		},
		hide : function(){
			//$(this.el).hide();
			$(this.el).fadeOut();
		}
	});

	var ImageModel = Backbone.Model.extend({

	});

	var ImageCollection = Backbone.Collection.extend({
		model : ImageModel
	});

	/*new FlickerGallery({el:$('.flickergallery')});
	*/
	new SearchView();

});

