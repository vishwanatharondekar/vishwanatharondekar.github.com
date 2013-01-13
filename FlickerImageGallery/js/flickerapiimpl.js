(function($){

	function jsonFlickrApi(response){
	    var gridContainer = $('.gridcontainer').css({'width':'400px'});
	    var photoList = response.photos.photo;
	    var totalResults = response.photos.total;
	    for(var index=0; index<photoList.length;index++){
	        var imageURL = 'http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_s.jpg';
	        var photoData = photoList[index];
	        var gridElement = $('<div>').css({float:'left'});
	        var imageURL = imageURL.replace('{farm-id}', photoData.farm);
	        imageURL = imageURL.replace('{id}', photoData.id);
	        imageURL = imageURL.replace('{secret}', photoData.secret);
	        imageURL = imageURL.replace('{server-id}', photoData.server);
	        var photoTitle = photoData.title;
	        var img = $('<img>').attr({'src':imageURL});
	        gridElement.append(img);
	        gridContainer.append(gridElement);
	    }
	}

	$.ajax({
	    url : 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=47adbb50cbdd79b35a80868356361172&tags=flower&per_page=20&page=3&format=json',
	    jsonpCallback : jsonFlickrApi,
	    //dataType: "jsonp",
	    success : function (response){
	        eval(response);
	    }

	});
}(jQuery));