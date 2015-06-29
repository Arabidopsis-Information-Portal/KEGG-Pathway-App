(function(window, $, undefined) {
  'use strict';

  var appContext = $('[data-app-name="testapp"]');

  var showSearchError = function(json) {
    // Later, display an error to the user. For now, display an error on the developer console.
    console.error('Search returned error! Status=' + json.obj.status + ' Message=' + json.obj.message);
    console.log(json);
    $('.data', appContext).html(json.obj.message);
  };






  $('#exampleModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    var id = button.data('id'); // Extract info from data-* attributes
    var name = button.data('name');
    var org = button.data('org');
    if (org === null){
      org = 'map';
    }
    var modal = $(this);
    modal.find('.modal-title').text('Pathway Map of ' + name);
    modal.find('.modal-body').html('<img src="http://rest.kegg.jp/get/' + org + id + '/image"><br/>' +
                  '<a href="http://www.kegg.jp/kegg-bin/highlight_pathway?map=' + org + id  +'" target="_blank">Image at KEGG</a>');
  });


  window.addEventListener('Agave::ready', function() {
    var Agave;//, help, helpItem, helpDetail, methods, methodDetail;

    Agave = window.Agave;

    //appContext.html('<h2>Hello AIP Science App &plus; Agave API!</h2><div class="api-help list-group"></div><hr><div class="api-info"></div><br>');

    var showSearchResult1 = function(json) {
      // JavaScript === and !== operators test value and type.
      if (json.obj.status !== 'success') {
          console.log('Search result status is NOT good!');
          return (false);
      }
      //console.log(json.obj.result);
      var html = '<table class="table hover row-border stripe"> <thead><tr>'+
                  '<th>KEGG Pathway ID</th> <th>KEGG Pathway Name</th> <th>Pathway Map</th>' +
                  '</tr></thead><tbody>';

      for (var i = 0; i < json.obj.result.length; i++) {
        var entry = json.obj.result[i];
        //console.log(json.obj.result[entry]);
        html += '<tr><td>' + entry.identifier + '</td><td>' + entry.name +
                '  <a role="button" data-toggle="collapse" href="#' + entry.identifier +
                '" aria-expanded="false" aria-controls="' + entry.identifier + '" id="b' + entry.identifier + '">' +
                '<span class="glyphicon glyphicon-collapse-down" aria-hidden="true"></a><br>\n' +
                '<div id="' + entry.identifier + '" class="blah collapse">Loading...</div></td>' +
                '<td><button type="button" class="btn btn-default btn-xs" '+ 'data-toggle="modal" data-target="#exampleModal" '+
                'data-id="' + entry.identifier + '" data-name="' + entry.name + '" data-org="' + entry.organism + '">Show</button></td></tr>\n';
      }
      html += '</tbody></table>';
      $('.data', appContext).html(html);


      $('.blah').on('show.bs.collapse', function() {
        var id = $(this).attr('id');
        var data = $(this);

        var showPathwayInfo = function(json) {
          var fields = json.obj.result[0].fields;
          var html = '';
          for (var i = 0; i < fields.length; i++) {
            html += '  - ' + fields[i] + '<br>\n';
          }
          data.html(html);

        };
        var query;
        if ($('#taxonId').val() === '') {
          query = {'identifier':id};
        } else {
          query = {'identifier':id, 'taxon_id': $('#taxonId').val()};
        }


        if ($(this).html() === 'Loading...') {
          Agave.api.adama.search(
                    {'namespace': 'bliu-dev',
               'service': 'pathway_v0.2',
               'queryParams': query},
              showPathwayInfo,
              showSearchError
                );
        }
        $('#b' + id).html('<span class="glyphicon glyphicon-collapse-up" aria-hidden="true">');
      });
      $('.blah').on('hide.bs.collapse', function() {
        var id = $(this).attr('id');
        $('#b'+id).html('<span class="glyphicon glyphicon-collapse-down" aria-hidden="true">');
      });


      $('.data table', appContext).DataTable({'columnDefs': [ { 'targets': 2, 'orderable': false } ]});
    };

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
                {'namespace': 'bliu-dev',
      	   'service': 'pathway_v0.2',
      	   'queryParams': query},
      	  showSearchResult1,
      	  showSearchError
            );
    });

    $('#reset').on('click', function() {
        $('#taxonId').val('');
        $('.gene_results').empty();
        $('.error').empty();
        $('.data', appContext).html('Reloading...');
        Agave.api.adama.search(
                  {'namespace': 'bliu-dev',
        	   'service': 'pathway_v0.2',
        	   'queryParams': {}},
        	  showSearchResult1,
        	  showSearchError
              );
    });


    Agave.api.adama.search(
              {'namespace': 'bliu-dev',
    	   'service': 'pathway_v0.2',
    	   'queryParams': {}},
    	  showSearchResult1,
    	  showSearchError
          );

  });

})(window, jQuery);
