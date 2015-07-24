(function(window, $, undefined) {
  'use strict';

  var appContext = $('[data-app-name="KEGG-Pathway-App"]');

  // This displays an error when Adama fails
  var showSearchError = function(json) {
    // Displays the error on the Javascript console
    console.error('Search returned error! Status=' + json.obj.status + ' Message=' + json.obj.message);
    // Creates an error alert on the page
    console.log(json);
    var html = '<div class="alert alert-danger" role="alert">' + json.obj.message + '</div>';
    $('#error', appContext).html(html);
  };

  // This code is from the Datatables website to sort IP addresses but it works
  // fine to sort EC numbers.
  jQuery.extend( jQuery.fn.dataTableExt.oSort, {
      'ip-address-pre': function ( a ) {
          var m = a.split('.'), x = '';

          for(var i = 0; i < m.length; i++) {
              var item = m[i];
              if(item.length === 1) {
                  x += '00' + item;
              } else if(item.length === 2) {
                  x += '0' + item;
              } else {
                  x += item;
              }
          }

          return x;
      },

      'ip-address-asc': function ( a, b ) {
          return ((a < b) ? -1 : ((a > b) ? 1 : 0));
      },

      'ip-address-desc': function ( a, b ) {
          return ((a < b) ? 1 : ((a > b) ? -1 : 0));
      }
  } );



  // Activates the tooltip (popup) for the reset button.
  $('[data-toggle="tooltip"]', appContext).tooltip();


  // The organism code of the taxon ID given
  var organism = null;
  var organismName = 'KEGG Reference Pathways';
  // The taxon ID given
  var input = '3702';
  var taxonInput;
  var pathwayInput;

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
      modal.find('.modal-title').text('Pathway Map of ' + name + ' in ' + organismName.substring(11));
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
      $('#error', appContext).empty();
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
        var query = {'pathway_id':path.pathway_id, 'taxon_id':input};

        // Calls adama using the parameters above
        Agave.api.adama.search(
                {'namespace': 'kegg',
                'service': 'kegg_pathways_v0.3',
                'queryParams': query},
                showOrgPathways,
                showSearchError
              );

      }
    };



    var showSearchResult1 = function(json) {
      $('#error', appContext).empty();
      // JavaScript === and !== operators test value and type.
      if (json.obj.status !== 'success') {
          console.log('Search result status is NOT good!');
          return (false);
      }

      // Creates a string of html to place into the document
      // This starts off the html for the table, with headers and classes that will
      // work with Datatables
      var html = '<h3>' + organismName + '</h3><table class="table display" width="100%"> <thead><tr>'+
                  '<th>KEGG Pathway ID</th> <th>KEGG Pathway Name</th> <th>Pathway Map</th>' +
                  '</tr></thead><tbody>';

      // Loops through every pathway of the returned json
      for (var i = 0; i < json.obj.result.length; i++) {
        // Sets entry as the result
        var entry = json.obj.result[i];
        // adds the html for one row in the table
        //First column is just the pathway ID
        html += '<tr><td>' + entry.pathway_id + '</td>' +
                // Second row is the name of the pathway...
                '<td>' + entry.pathway_name +
                // and the button to expand. The button is a linked (<a>) icon (<span>)
                // Each button is given a unique id that is in the form b + pathway ID (e.g. "b00010")
                // so the button can be identified and the right infromation can be retrieved later
                '  <a role="button" data-toggle="collapse" href="#' + entry.pathway_id +
                '" aria-expanded="false" aria-controls="' + entry.pathway_id + '" id="b' + entry.pathway_id + '">' +
                '<span class="glyphicon glyphicon-collapse-down" aria-hidden="true"></a><br>\n' +
                // The div holds the area that will be expanded, and is given the id of just the pathway ID (e.g. "00010")
                '<div id="' + entry.pathway_id + '" class="pinfo collapse">Loading...</div></div></td>' +
                // Third (last) column is a button to show the modal (popup)
                // Data is sent through data-id and data-name attributes
                '<td><button type="button" class="btn btn-default btn-xs" '+ 'data-toggle="modal" data-target="#exampleModal" '+
                'data-id="' + entry.pathway_id + '" data-name="' + entry.pathway_name + '">Show</button></td></tr>\n';
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
          var flag = false;
          for (var i = 0; i < order.length; i++) {
            if (fields.indexOf(order[i]) !== -1) {
              // Adds html to display the info for the current field
              html += '<li><b>' + order[i] + '</b>: ' + results[order[i]] + '</li>\n';
              flag = true;
            }
          }
          if (flag===false) {
            html += '<li>No information</li>';
          }
          // If organism is a field (the pathway is organism specific), add an entry of the list
          // that would allow the user to display the list of genes
          if (fields.indexOf('organism') !== -1) {
            // Displays Genes and a button with a unique id g + pathway ID (e.g. "g00010")
            // This button controls another expandable field.
            html += '<li><b><button href="#" class="btn btn-default btn-xs genelink" id="'+ id + '-link">Show genes </b></li>\n';

            //Ends the list
            html += '</ul>';
            // Puts the html in the document
            data.html(html);

            $('.genelink', appContext).click(function(){
              var id = $(this).attr('id');
              id = id.substring(0, id.length - 5);
              console.log(id);
              $('#geneTaxonId', appContext).val(input);
              $('#pathwayId', appContext).val(id);
              $('#genetab', appContext).tab('show');
              $('form[name=gene-form]', appContext).submit();

            });

          } else { // Not an organism specific pathway

            html += '<li><b><button href="#" class="btn btn-default btn-xs genelink" id="'+ id + '-link">Show KEGG orthology genes</b></li>\n';

            //Ends the list
            html += '</ul>';
            // Puts the html in the document
            data.html(html);

            $('.genelink', appContext).click(function(){
              var id = $(this).attr('id');
              id = id.substring(0, id.length - 5);
              console.log(id);
              $('#geneTaxonId', appContext).val('');
              $('#pathwayId', appContext).val(id);
              $('#genetab', appContext).tab('show');
              $('form[name=gene-form]', appContext).submit();

            });
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
                    {'namespace': 'kegg',
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
      $('.data table', appContext).DataTable({'columnDefs': [ { 'targets': 2, 'orderable': false }]});
    };

    // This function will show the table of the genes in a pathway.
    var showGeneList = function(json){

      // Remove the displayed error if there is one
      $('#error', appContext).empty();

      // Gets the list of genes from the JSON from Adama
      var list = json.obj.result;
      // Creates a string of the html to place in the document.
      var html = '<table class="table display" width="100%"> <thead><tr>'+
                  '<th>Gene Locus</th> <th>Gene Name</th><th>EC Number</th><th>KEGG Orthology ID</th></tr></thead><tbody>\n';

      // Parses the list of genes and create the html for the table
      for (var i = 0; i < list.length; i++) {
        // Gets the EC number and locus from the data and replaces the data
        // with words if the data does not exist.
        var ecnum = list[i].ec_number;
        var locus = list[i].locus_id;
        if (locus === null) {
            locus = 'N/A';
        }
        if (ecnum === undefined) {
          ecnum = 'Not Assigned';
        } else {
          ecnum = ecnum.replace(/\s/g, '<br>');
        }
        // Adds the html to the string
        html+='<tr><td>' + locus + '</td><td>'+ list[i].gene_name +
          '</td><td>'+ ecnum + '</td><td>'+ list[i].kegg_orthology_id + '</td></tr>\n';

      }

      // Creates a function that will get the organism name and pathway name that
      // will be called after the Adama query below
      function getOrganism(json2) {
        // Gets the taxon name and pathway name from the returned json
        var taxonName = json2.obj.result[0].taxon_name;
        var pathwayName = json2.obj.result[0].name;
        // Creates a header with the name of the pathway and organism is applicable
        if (taxonName === null) {
          html = '<h3>' + pathwayName + ' Reference Pathway</h3>' + html;
        } else {
          html = '<h3>' + pathwayName + ' in ' + taxonName + '</h3>' + html;
        }
        // Sets the html of the header and the table to display
        $('#genes', appContext).html(html+ '</tbody></table>');
        // Formats the table with datatables, setting the third column as an IP
        // address (even though its an EC number) to sort properly.
        $('#genes table', appContext).DataTable( {
          columnDefs: [{ type: 'ip-address', targets: 2 }]
        });
      }


      var query;
      // If a taxon was given, query API with taxon and pathway
      if (taxonInput !== '') {
        query = {'taxon_id':taxonInput, 'pathway_id':pathwayInput};
      } else { // Else just query with pathway
        query = {'pathway_id':pathwayInput};
      }

      // Calls Adama to get information about the pathway
      Agave.api.adama.search(
                {'namespace': 'kegg',
           'service': 'kegg_pathways_v0.3',
           'queryParams': query},
          getOrganism,
          showSearchError
            );

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
                {'namespace': 'kegg',
      	   'service': 'kegg_pathways_v0.3',
      	   'queryParams': query},
      	  getOrgCode,
      	  showSearchError
            );
    });



    $('#specific', appContext).change(function() {
      if ($(this).is(':checked')) {
        $('#taxon_textbox', appContext).collapse('hide');
        input = '3702';
        $('.data', appContext).html('Reloading...');
        Agave.api.adama.search(
                  {'namespace': 'kegg',
             'service': 'kegg_pathways_v0.3',
             'queryParams': {'taxon_id':'3702'}},
            getOrgCode,
            showSearchError
              );
        // Removes errors from the form that is now hidden
        $('form[name=taxon_form]', appContext).removeClass('has-error');
        $('#submit', appContext).removeAttr('disabled');
        $('#taxon-form-error').fadeOut(200);
      } else {
        $('#taxon_textbox', appContext).collapse('show');
        $('#taxonId', appContext).val('');
        input = '';
        organismName = 'KEGG Reference Pathways';
        $('.data', appContext).html('Reloading...');
        Agave.api.adama.search(
                  {'namespace': 'kegg',
        	   'service': 'kegg_pathways_v0.3',
        	   'queryParams': {}},
        	  showSearchResult1,
        	  showSearchError
              );
      }
    });

    // Runs when the input in the taxon text box is changed
    $('#taxonId', appContext).on('input', function() {
      // Gets the value in the textbox

      var val = $(this).val();
      // Creates a regular expression to check the validity of the text
      // This checks that the input is only numbers
      var regex = /^[0-9]+$/;
      // If the it is valid, or the field is empty
      if (regex.test(val) || val === '') {
        // Set the textbox as having no error
        $('form[name=taxon_form]', appContext).removeClass('has-error');
        // Enable the submit button
        $('#submit', appContext).removeAttr('disabled');
        $('#taxon-form-error').fadeOut(200);
      } else { // input is invalid
        // Change the textbox appearance to having an error (red)
        $('form[name=taxon_form]', appContext).addClass('has-error');
        // Disable the submit button
        $('#submit', appContext).attr('disabled', 'disabled');
        $('#taxon-form-error', appContext).fadeIn(200);
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
        $('#taxon-form-error', appContext).fadeOut(200);
        // resets the organism and input variables
        organism = null;
        input = '';
        organismName = 'KEGG Reference Pathways';
        // Calls Adama with no parameters
        Agave.api.adama.search(
                  {'namespace': 'kegg',
        	   'service': 'kegg_pathways_v0.3',
        	   'queryParams': {}},
        	  showSearchResult1,
        	  showSearchError
              );
    });


    // Called when info is submitted on gene list form
    $('form[name=gene-form]', appContext).on('submit', function(e) {
      // Prevents the button from default trying to POST
      e.preventDefault();

      // Gets the input values
      var taxon = this.geneTaxonId.value;
      var pathway = this.pathwayId.value;
      var flag = true;
      var taxonRegex = /^[0-9]+$/;
      var pathwayRegex = /\b\d{5}\b/g;

      $('#gene-form-path-error',appContext).empty();

      if (pathway === '') {
          $(this).addClass('has-error');
          $('#gene-form-path-error', appContext).html('Pathway ID is required.');
          $('#gene-form-path-error', appContext).fadeIn(200);
          flag = false;
      }

      if (!(taxonRegex.test(taxon) || taxon === '')) {
        $('#gene-form-tax-error', appContext).fadeIn(200);
        flag = false;
      }


      if (!(pathwayRegex.test(pathway) || pathway === '')) {
        $(this).addClass('has-error');
        $('#gene-form-path-error', appContext).html('Invalid pathway ID format. Should be a five digit number.');
        $('#gene-form-path-error', appContext).fadeIn(200);
        flag = false;
      }

      if (flag) {

        $('#gene-form-path-error', appContext).fadeOut(200);
        $('#gene-form-tax-error', appContext).fadeOut(200);
        $('form[name=gene-form]', appContext).removeClass('has-error');
        $('#submit-gene', appContext).removeAttr('disabled');

        // Sets the document to display Reloading
        $('#genes', appContext).html('Loading...');

        // Removes the error message if it exists
        $('#error', appContext).empty();

        taxonInput = taxon;
        pathwayInput = pathway;
        // Creates parameters to call Adama with

        var query;

        if (taxon === '') {
          query = {
            'pathway_id':pathway
          };
        } else {
          query = {
            'taxon_id': taxon,
            'pathway_id':pathway
          };
        }

        // Calls Adama
        Agave.api.adama.search(
                {'namespace': 'kegg',
                'service': 'genes_by_kegg_pathway_v0.3',
                'queryParams': query},
          showGeneList,
          showSearchError
            );
      }
    });


    // Runs when the input ion the genes page is changed
    $('form[name=gene-form]', appContext).on('input', function() {
      var taxon = this.geneTaxonId.value;
      var pathway = this.pathwayId.value;
      var flag = true;
      var taxonRegex = /^[0-9]+$/;
      var pathwayRegex = /^[0-9]{1,5}$/;

      if (!(taxonRegex.test(taxon) || taxon === '')) {
        $('#gene-form-tax-error', appContext).fadeIn(200);
        flag = false;
      } else {
        $('#gene-form-tax-error', appContext).fadeOut(200);
      }

      if (!(pathwayRegex.test(pathway) || pathway === '')) {
        $('#gene-form-path-error', appContext).html('Invalid pathway ID format. Should be a five digit number.');
        $('#gene-form-path-error', appContext).fadeIn(200);
        flag = false;
      } else {
        $('#gene-form-path-error', appContext).fadeOut(200);
      }

      // Remove the error for the form
      if (flag) {
        $('form[name=gene-form]', appContext).removeClass('has-error');
        $('#submit-gene', appContext).removeAttr('disabled');
      } else {
        $('#submit-gene', appContext).attr('disabled', 'disabled');
        $(this).addClass('has-error');
      }
    });


    // When the reset button is called
    $('#reset-gene', appContext).on('click', function() {
        // Clear the text boxes
        $('#geneTaxonId', appContext).val('');
        $('#pathwayId', appContext).val('');
        // Change the text to reloading
        $('#genes', appContext).html('Enter a taxon ID and a pathway ID.');
        // Set the textbox as having no errors
        $('form[name=gene-form]', appContext).removeClass('has-error');
        //Enable submit button again
        $('#submit', appContext).removeAttr('disabled');
        // Removes the error message if it exists
        $('#error', appContext).html();
        $('#gene-form-path-error', appContext).fadeOut(200);
        $('#gene-form-tax-error', appContext).fadeOut(200);
        taxonInput = '';
        pathwayInput = '';
    });


    // Calls Adama
    Agave.api.adama.search(
              {'namespace': 'kegg',
    	   'service': 'kegg_pathways_v0.3',
    	   'queryParams': {'taxon_id':input}},
    	  getOrgCode,
    	  showSearchError
          );

  });

})(window, jQuery);
