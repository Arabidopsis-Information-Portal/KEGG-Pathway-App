(function(window, $, undefined) {
  'use strict';

  console.log('Hello, testapp!');

  var appContext = $('[data-app-name="testapp"]');

  var showSearchError = function(json) {
    // Later, display an error to the user. For now, display an error on the developer console.
    console.error('Search returned error! Status=' + json.obj.status + ' Message=' + json.obj.message);
    console.log(json);
    $('.data', appContext).html(json.obj.message);
  };

  var showSearchResult1 = function(json) {
  	// JavaScript === and !== operators test value and type.
  	if (json.obj.status !== 'success') {
  	    console.log('Search result status is NOT good!');
  	    return (false);
  	}
    //console.log(json.obj.result);
    var html = '<table> <thead><tr>'+
                '<th>KEGG Pathway ID</th> <th>KEGG Pathway Name</th> <th>Pathway Map</th>' +
                '</tr></thead><tbody>';

    for (var i = 0; i < json.obj.result.length; i++) {
      var entry = json.obj.result[i];
      //console.log(json.obj.result[entry]);
      html += '<tr><td>' + entry.identifier + '</td><td>' + entry.name + '</td>\n' +
              '<td><button type="button" class="btn btn-default btn-xs" '+ 'data-toggle="modal" data-target="#exampleModal" '+
              'data-id="' + entry.identifier + '" data-name="' + entry.name + '">Show</button></td></tr>\n';
    }
    html += '</tbody></table>';
    console.log('hello');
    $('.data', appContext).html(html);
    $('.data table', appContext).DataTable();
  };


  $('#exampleModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    var id = button.data('id'); // Extract info from data-* attributes
    var name = button.data('name');

    var modal = $(this);
    modal.find('.modal-title').text('Pathway Map of ' + name);
    modal.find('.modal-body').html('<img src="http://rest.kegg.jp/get/map' + id + '/image"><br/>' +
                  '<a href="http://www.kegg.jp/kegg-bin/highlight_pathway?map=map' + id  +'">Image at KEGG</a>');
  });


  window.addEventListener('Agave::ready', function() {
    var Agave;//, help, helpItem, helpDetail, methods, methodDetail;

    Agave = window.Agave;

    //appContext.html('<h2>Hello AIP Science App &plus; Agave API!</h2><div class="api-help list-group"></div><hr><div class="api-info"></div><br>');

    $('form[name=taxon_form]').on('submit', function(e) {
      e.preventDefault();
      $('.data', appContext).html('Reloading...');

      var query = {
        'taxon_id': this.taxonId.value,
      };

      if (this.taxonId.value === '') {
        query = {};
      }

      $('.gene_results').empty();
      $('.error').empty();
      Agave.api.adama.search(
                {'namespace': 'bliu',
      	   'service': 'pathway_v0.2',
      	   'queryParams': query},
      	  showSearchResult1,
      	  showSearchError
            );
    });



    Agave.api.adama.search(
              {'namespace': 'bliu',
    	   'service': 'pathway_v0.2',
    	   'queryParams': {}},
    	  showSearchResult1,
    	  showSearchError
          );

  });

})(window, jQuery);
