(function(window, $, undefined) {
  'use strict';

  var appContext = $('[data-app-name="testapp"]');

  var showSearchError = function(json) {
    // Later, display an error to the user. For now, display an error on the developer console.
    console.error('Search returned error! Status=' + json.obj.status + ' Message=' + json.obj.message);
    console.log(json);
    var html = '<div class="alert alert-danger" role="alert">' + json.obj.message + '</div>';
    $('.data', appContext).html(html);
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
                '<div id="' + entry.identifier + '" class="pinfo collapse">Loading...</div></div></td>' +
                '<td><button type="button" class="btn btn-default btn-xs" '+ 'data-toggle="modal" data-target="#exampleModal" '+
                'data-id="' + entry.identifier + '" data-name="' + entry.name + '" data-org="' + entry.organism + '">Show</button></td></tr>\n';
      }
      html += '</tbody></table>';
      $('.data', appContext).html(html);


      $('.pinfo').on('show.bs.collapse', function() {
        var id = $(this).attr('id');
        var data = $(this);

        var showPathwayInfo = function(json) {
          var results = json.obj.result[0];
          var fields = Object.keys(results);
          var order = ['name', 'description', 'class', 'organism', 'ko_pathway'];
          var html = '<dl>';
          for (var i = 0; i < order.length; i++) {
            if (fields.indexOf(order[i]) !== -1) {
              html += '<dt>' + order[i] + '</dt><dd>' + results[order[i]] + '</dd>\n';
            }
          }
          if (fields.indexOf('organism') !== -1) {
            html += '<dt>genes <a role="button" data-toggle="collapse" href="#' + id +
            '-gene" aria-expanded="false" aria-controls="' + id + '-gene" id="g' + id + '">' +
            '<span class="glyphicon glyphicon-collapse-down" aria-hidden="true"></a><dt>\n' +
            '<dd><div id="' + id + '-gene" class="genes collapse">Loading...</div></dd>';
            html += '</dl>';
            data.html(html);

            $('.genes').on('show.bs.collapse', function() {
              var id = $(this).attr('id');
              id = id.substring(0, id.length - 5);
              var data2 = $(this);
              console.log(id);
              var showGenes = function(json) {

                var html2 = '<dl class="dl-horizontal">';
                var results = json.obj.result;
                for (var i = 0; i < results.length; i++) {
                  html2 += '<dt>' + results[i].locus + '</dt><dd>' + results[i].gene + '</dd>\n';
                }
                data2.html(html2+'</dl>');
              };

              query = {'pathway_id':id, 'taxon_id': $('#taxonId').val()};


              if ($(this).html() === 'Loading...') {
                Agave.api.adama.search(
                          {'namespace': 'bliu-dev',
                     'service': 'genes_by_kegg_pathway_v0.1',
                     'queryParams': query},
                    showGenes,
                    showSearchError
                      );
              }
              $('#g' + id).html('<span class="glyphicon glyphicon-collapse-up" aria-hidden="true">');


            });
            $('.genes').on('hide.bs.collapse', function() {
              var id = $(this).attr('id');
              $('#g'+id).html('<span class="glyphicon glyphicon-collapse-down" aria-hidden="true">');
            });

          } else {
            html += '</dl>';

            data.html(html);
          }
        };
        var query;
        if ($('#taxonId').val() === '') {
          query = {'pathway_id':id};
        } else {
          query = {'pathway_id':id, 'taxon_id': $('#taxonId').val()};
        }


        if ($(this).html() === 'Loading...') {
          Agave.api.adama.search(
                    {'namespace': 'bliu-dev',
               'service': 'kegg_pathways_v0.3',
               'queryParams': query},
              showPathwayInfo,
              showSearchError
                );
        }
        $('#b' + id).html('<span class="glyphicon glyphicon-collapse-up" aria-hidden="true">');
      });
      $('.pinfo').on('hide.bs.collapse', function() {
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
      	   'service': 'kegg_pathways_v0.3',
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
        	   'service': 'kegg_pathways_v0.3',
        	   'queryParams': {}},
        	  showSearchResult1,
        	  showSearchError
              );
    });


    Agave.api.adama.search(
              {'namespace': 'bliu-dev',
    	   'service': 'kegg_pathways_v0.3',
    	   'queryParams': {}},
    	  showSearchResult1,
    	  showSearchError
          );

  });

})(window, jQuery);
