(function(window, $, undefined) {
  'use strict';

  console.log('Hello, testapp!');

  var appContext = $('[data-app-name="testapp"]');

  var showSearchError = function(json) {
    // Later, display an error to the user. For now, display an error on the developer console.
    console.error('Search returned error! Status=' + json.obj.status + ' Message=' + json.obj.message);
    console.log(json);
    $('.data', appContext).html('Error loading data :(');
  };

  var showSearchResult1 = function(json) {
  	// JavaScript === and !== operators test value and type.
  	if (json.obj.status !== 'success') {
  	    console.log('Search result status is NOT good!');
  	    return (false);
  	}
    //console.log(json.obj.result);
    var html = '<table> <thead><tr>'+
                '<th>KEGG Pathway ID</th> <th>KEGG Pathway Name</th>' +
                '</tr></thead><tbody>';

    for (var i = 0; i < json.obj.result.length; i++) {
      var entry = json.obj.result[i];
      //console.log(json.obj.result[entry]);
      html += '<tr><td>' + entry.identifier + '</td><td>' + entry.name + '</td></tr>\n';
    }
    html += '</tbody></table>';
    console.log('hello');
    $('.data', appContext).html(html);
    $('.data table', appContext).DataTable();
  };

  window.addEventListener('Agave::ready', function() {
    var Agave;//, help, helpItem, helpDetail, methods, methodDetail;

    Agave = window.Agave;

    //appContext.html('<h2>Hello AIP Science App &plus; Agave API!</h2><div class="api-help list-group"></div><hr><div class="api-info"></div><br>');


    Agave.api.adama.search(
              {'namespace': 'bliu',
    	   'service': 'pathway_v0.2',
    	   'queryParams': {}},
    	  showSearchResult1,
    	  showSearchError
          );

  });

})(window, jQuery);
