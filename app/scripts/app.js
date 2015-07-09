(function(window, $, undefined) {
  'use strict';

  var appContext = $('[data-app-name="KEGG-Pathway-App"]');

  // This displays an error when Adama fails
  var showSearchError = function(json) {
    // Displays the error on the Javascript console
    console.error('Search returned error! Status=' + json.obj.status + ' Message=' + json.obj.message);
    // Creates an error alert on the page
    var html = '<div class="alert alert-danger" role="alert">' + json.obj.message + '</div>';
    $('#error', appContext).html(html);
  };

  // Activates the tooltip (popup) for the reset button.
  $('[data-toggle="tooltip"]').tooltip();


  // The organism code of the taxon ID given
  var organism = null;
  var organismName = 'KEGG Reference Pathways';
  // The taxon ID given
  var input = '';

  // This is called whenever the modal (popup with pathway map) is called to be shown
  $('#exampleModal', appContext).on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    // gets the fields from the button that called it (from data-* attributes)
    var id = button.data('id');
    var name = button.data('name');

    // If no organism is given, set the organism code to map
    var org = organism;
    if (organism === null){
      org = 'map';
    }
    // Sets the variable modal to this, which is the modal
    var modal = $(this);
    // Sets the title of the modal
    if (organismName === 'KEGG Reference Pathways'){
      modal.find('.modal-title').text('Reference Pathway Map of ' + name );
    } else {
      modal.find('.modal-title').text('Pathway Map of ' + name + ' in ' + organismName);
    }
    // Puts the picture and link in the body of the modal
    modal.find('.modal-body').html('<img src="http://rest.kegg.jp/get/' + org + id + '/image"><br/>' +
                  '<a href="http://www.kegg.jp/kegg-bin/highlight_pathway?map=' + org + id  +'" target="_blank">Image at KEGG</a>');
  });


  window.addEventListener('Agave::ready', function() {
    var Agave;//, help, helpItem, helpDetail, methods, methodDetail;

    Agave = window.Agave;

    // Function that is called when a taxon ID is submitted
    var getOrgCode = function(json) {

      // If the taxon ID field is empty, just diplay the results normally.
      if (input === '') {
        organism = null;
        organismName = 'KEGG Reference Pathways';
        showSearchResult1(json);

      } else { // If the taxon ID field contins something

        // Gets the first pathway from the returned JSON
        var path = json.obj.result[0];

        // Creates a new function to handle extracting the organism code out of a single pathway
        var showOrgPathways = function(json2) {
          // Gets the organism field of the pathway
          var org = json2.obj.result[0].organism;
          var index = org.indexOf('[');
          // sets the organism code into organism so it can be used later
          organism = org.substring(index+4, index+7);
          organismName = 'Pathways in ' + org.substring(0, index-1);
          // displays the results
          showSearchResult1(json);

        };

        // Create a list of parameters to query Adama with
        var query = {'pathway_id':path.identifier, 'taxon_id':input};

        // Calls adama using the parameters above
        Agave.api.adama.search(
                {'namespace': 'bliu-dev',
                'service': 'kegg_pathways_v0.3',
                'queryParams': query},
                showOrgPathways,
                showSearchError
              );

      }
    };



    var showSearchResult1 = function(json) {
      // JavaScript === and !== operators test value and type.
      if (json.obj.status !== 'success') {
          console.log('Search result status is NOT good!');
          return (false);
      }

      // Creates a string of html to place into the document
      // This starts off the html for the table, with headers and classes that will
      // work with Datatables
      var html = '<h3>' + organismName + '</h3><table class="table hover row-border stripe"> <thead><tr>'+
                  '<th>KEGG Pathway ID</th> <th>KEGG Pathway Name</th> <th>Pathway Map</th>' +
                  '</tr></thead><tbody>';

      // Loops through every pathway of the returned json
      for (var i = 0; i < json.obj.result.length; i++) {
        // Sets entry as the result
        var entry = json.obj.result[i];
        // adds the html for one row in the table
        //First column is just the pathway ID
        html += '<tr><td>' + entry.identifier + '</td>' +
                // Second row is the name of the pathway...
                '<td>' + entry.name +
                // and the button to expand. The button is a linked (<a>) icon (<span>)
                // Each button is given a unique id that is in the form b + identifier (e.g. "b00010")
                // so the button can be identified and the right infromation can be retrieved later
                '  <a role="button" data-toggle="collapse" href="#' + entry.identifier +
                '" aria-expanded="false" aria-controls="' + entry.identifier + '" id="b' + entry.identifier + '">' +
                '<span class="glyphicon glyphicon-collapse-down" aria-hidden="true"></a><br>\n' +
                // The div holds the area that will be expanded, and is given the id of just the identifier (e.g. "00010")
                '<div id="' + entry.identifier + '" class="pinfo collapse">Loading...</div></div></td>' +
                // Third (last) column is a button to show the modal (popup)
                // Data is sent through data-id and data-name attributes
                '<td><button type="button" class="btn btn-default btn-xs" '+ 'data-toggle="modal" data-target="#exampleModal" '+
                'data-id="' + entry.identifier + '" data-name="' + entry.name + '">Show</button></td></tr>\n';
      }
      // Ends the html for the table
      html += '</tbody></table>';
      // Puts the html into the document to be shown
      $('.data', appContext).html(html);

      // This is called whenever the additional info for a pathway is called to expand
      $('.pinfo', appContext).on('show.bs.collapse', function() {

        // Gets the id of the area being expanded (which is the same as the pathway_id)
        var id = $(this).attr('id');
        // Sets data as the current object so it can be used later when it is no longer the current object
        var data = $(this);

        // This function is called to show the data received about a specific pathway
        var showPathwayInfo = function(json) {
          // Gets the pathway
          var results = json.obj.result[0];
          // Gets all the fields of the object that has the pathwya info
          var fields = Object.keys(results);
          // This is the order that the fields should be displayed in for the table
          var order = ['description', 'class', 'organism'];
          // Creates html to put in the expandable container. This starts a description list
          var html = '<br><ul class="list-unstyled">';
          // Loops through all elements in the order array and gets that field in the object (if it exists)
          for (var i = 0; i < order.length; i++) {
            if (fields.indexOf(order[i]) !== -1) {
              // Adds html to display the info for the current field
              html += '<li><b>' + order[i] + '</b>: ' + results[order[i]] + '</li>\n';
            }
          }
          // If organism is a field (the pathway is organism specific), add an entry of the list
          // that would allow the user to display the list of genes
          if (fields.indexOf('organism') !== -1) {
            // Displays Genes and a button with a unique id g + identifier (e.g. "g00010")
            // This button controls another expandable field.
            html += '<li><b>genes </b><a role="button" data-toggle="collapse" href="#' + id +
            '-gene" aria-expanded="false" aria-controls="' + id + '-gene" id="g' + id + '">' +
            '<span class="glyphicon glyphicon-collapse-down" aria-hidden="true"></a></li>\n' +
            // The div holds the expandable field with unique id  identifier + -genes (e.g. "00010-genes")
            '<li><div id="' + id + '-gene" class="genes collapse">Loading...</div></li>';
            //Ends the list
            html += '</ul>';
            // Puts the html in the document
            data.html(html);

            // This function is called when the field holding the list of genes is called to expand
            // Note this must be after the html is updated in the document
            $('.genes', appContext).on('show.bs.collapse', function() {
              // Gets the id of the area being expanded and removes the -genes at the end
              var id = $(this).attr('id');
              id = id.substring(0, id.length - 5);

              // Sets data2 as the current object so it can be used later
              var data2 = $(this);

              // Creates a new function that will be called when Adama returns with the list of genes in the pathway
              var showGenes = function(json) {
                // Creates a new description list that contains the genes and gene names
                var html2 = '<dl class="dl-horizontal">';
                // Gets the array of results
                var results = json.obj.result;
                // Loops through all the results
                for (var i = 0; i < results.length; i++) {
                  // Adds html to show gene locus as term and gene name as description of term.
                  // The gene locus is linked to the information at KEGG
                  html2 += '<dt><a href="http://www.kegg.jp/dbget-bin/www_bget?' + organism + ':' + results[i].locus +
                           '" target="_blank">' + results[i].locus +  '</a></dt><dd>' + results[i].gene + '</dd>\n';
                }
                // Finishes the html and updates the document
                data2.html(html2+'</dl>');
              };

              // Creates a list of parameters to query Adama with
              query = {'pathway_id':id, 'taxon_id': input};

              // Calls Adama if the genes have not been loaded before.
              if ($(this).html() === 'Loading...') {
                Agave.api.adama.search(
                          {'namespace': 'bliu-dev',
                     'service': 'genes_by_kegg_pathway_v0.1',
                     'queryParams': query},
                    showGenes,
                    showSearchError
                      );
              }

              // Changes the icon for the gene list button from expand to collapse
              $('#g' + id, appContext).html('<span class="glyphicon glyphicon-collapse-up" aria-hidden="true">');


            });

            // Called then the area with the gene list is called to collapse
            $('.genes', appContext).on('hide.bs.collapse', function(e) {
              // Stops the collapse form propagating. The pathway info is also an expandable area, and will also
              // trigger from the inside expansion unless the event is stopped from propagating.
              e.stopPropagation();
              // Gets the id of the area expanded, removeing -genes at the end
              var id = $(this).attr('id');
              id = id.substring(0, id.length - 5);
              // Changed the button from collapse to expand
              $('#g'+id, appContext).html('<span class="glyphicon glyphicon-collapse-down" aria-hidden="true">');
            });

          } else { // Remember, all that was only if there was an organism given
            // If no organism is given, does not add genes, and teh required code for
            // displaying the list of genes, and ends the list of fields in the pathway info
            // and updates the document
            html += '</dl>';

            data.html(html);
          }
        };

        // We just finished the function that handles displaying the return info
        // from Adama if pathway info is requested. The function will only be called
        // after Adama has retrieved the information. This is true for all functions referenced
        // in calls to Adama

        // Creates the parameters to query Adama with.
        var query;
        if (input === '') {
          query = {'pathway_id':id};
        } else {
          query = {'pathway_id':id, 'taxon_id': input};
        }

        // Calls Adama for the pathway info
        if ($(this, appContext).html() === 'Loading...') {
          Agave.api.adama.search(
                    {'namespace': 'bliu-dev',
               'service': 'kegg_pathways_v0.3',
               'queryParams': query},
              showPathwayInfo, //Calls showPathwayInfo with the results if call is successful
              showSearchError // Calls showSearchError if call fails
                );
        }
        // Sets the button that show pathway info from expand to collapse
        $('#b' + id, appContext).html('<span class="glyphicon glyphicon-collapse-up" aria-hidden="true">');
      });

      // This is called when the area holding pathway info is called to collapse
      $('.pinfo', appContext).on('hide.bs.collapse', function() {
        // Gets the id of the area
        var id = $(this).attr('id');
        // Sets the button that show pathway info from collapse to expand
        $('#b'+id, appContext).html('<span class="glyphicon glyphicon-collapse-down" aria-hidden="true">');
      });

      // Calls Datatables to go through the document and create the table form the html
      // Sets the last column (show pahtway buttons) to not orderable
      $('.data table', appContext).DataTable({'columnDefs': [ { 'targets': 2, 'orderable': false } ]});
    };

    // This function is called when the taxon form is submitted
    $('form[name=taxon_form]', appContext).on('submit', function(e) {
      // Prevents the button from default trying to POST
      e.preventDefault();

      // Sets the document to display Reloading
      $('.data', appContext).html('Reloading...');

      // Removes the error message if it exists
      $('#error', appContext).empty();

      // Gets the input and saves it
      input = this.taxonId.value;

      // Creates parameters to call Adama with
      var query = {
        'taxon_id': input,
      };

      // If the taxon field was empty, give no parameters to Adama
      if (input === '') {
        query = {};
      }

      // Calls Adama
      Agave.api.adama.search(
                {'namespace': 'bliu-dev',
      	   'service': 'kegg_pathways_v0.3',
      	   'queryParams': query},
      	  getOrgCode,
      	  showSearchError
            );
    });

    // Runs when the input in the taxon text box is changed
    $('#taxonId', appContext).on('input', function() {
      // Gets the value in the textbox
      var val = $('#taxonId', appContext).val();
      // Creates a regular expression to check the validity of the text
      // This checks that the input is only numbers
      var regex = /^[0-9]+$/;
      // If the it is valid, or the field is empty
      if (regex.test(val) || val === '') {
        // Set the textbox as having no error
        $('form[name=taxon_form]', appContext).removeClass('has-error');
        // Enable the submit button
        $('#submit', appContext).removeAttr('disabled');
      } else { // input is invalid
        // Change the textbox appearance to having an error (red)
        $('form[name=taxon_form]', appContext).addClass('has-error');
        // Disable the submit button
        $('#submit', appContext).attr('disabled', 'disabled');
      }

    });

    // When the reset button is called
    $('#reset', appContext).on('click', function() {
        // Clear the taxon text box
        $('#taxonId', appContext).val('');
        // Change the text to reloading
        $('.data', appContext).html('Reloading...');
        // Set the textbox as having no errors
        $('form[name=taxon_form]', appContext).removeClass('has-error');
        //Enable submit button again
        $('#submit', appContext).removeAttr('disabled');
        // Removes the error message if it exists
        $('#error', appContext).empty();
        // resets the organism and input variables
        organism = null;
        input = '';
        organismName = 'KEGG Reference Pathways';
        // Calls Adama with no parameters
        Agave.api.adama.search(
                  {'namespace': 'bliu-dev',
        	   'service': 'kegg_pathways_v0.3',
        	   'queryParams': {}},
        	  showSearchResult1,
        	  showSearchError
              );
    });

    // Calls Adama
    Agave.api.adama.search(
              {'namespace': 'bliu-dev',
    	   'service': 'kegg_pathways_v0.3',
    	   'queryParams': {}},
    	  showSearchResult1,
    	  showSearchError
          );

  });

})(window, jQuery);
