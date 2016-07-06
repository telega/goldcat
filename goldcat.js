/////////////////////////////////
// GoldCat - Metalsmith Plugin //
// for Goldsmiths Degree Show  //
/////////////////////////////////

var fs = require('fs'),
	showdown = require('showdown'),
    converter = new showdown.Converter({noHeaderId:true});

var makePages = function(options){
	
	//this plugin takes the variables for the YAML files and builds the student pages

	var year = options.year;
	var course =options.course;
	var basepath = options.bp;

	return function (files, metalsmith, done){
		
		console.log('Preparing student pages ...'.yellow);

		for(var file in files){
			var fileObject = files[file];
			var myPages = fileObject.pages;

			
			// if the page has a pages variable , it is a student page so we need
			// to process the YAML and build additional pages
			if(myPages){
				console.log('Found Pages for: '+fileObject.name);
				var numPages = Object.keys(myPages).length;
				//delete pages from object, we already have this in myPages
				delete fileObject.pages;

				//build new pages
				for(var i = 1; i < numPages+1; i ++){
					//create a temporary page using JSON hackery. Ugh.
					var tempPage = JSON.parse(JSON.stringify(fileObject));
					var newPageProperties = myPages[i];
					//add properties to temporary Page
					tempPage.year = year;
					tempPage.course = course;
					tempPage.pageNumber = i;
					tempPage.numPages = numPages;
					tempPage.pagination = {
						page: i,
						pageCount: numPages
					};
					//if its a first page add the page to collections for later use in index...
					if(i===1){
						tempPage.collection = 'students';
					}

					var pageType = newPageProperties['type'];

					//choose the correct template based on type
					
					switch(pageType){

						case "image":
						tempPage.template = "image.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = "" + newPageProperties['media'];
						tempPage.title = "" + newPageProperties['title'];
						break;

						case "video":
						tempPage.template = "video.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = ""+ newPageProperties['media'];
						tempPage.title = "" + newPageProperties['title'];

						//for videos we need this property for formatting the css with a javascript later...
						if(newPageProperties['aspect'] === '4x3'){
							tempPage.mejsPadding = '75';
							tempPage.videoHeight = '540';
						}
						else{
							tempPage.mejsPadding = '57'; 
							tempPage.videoHeight= '405';
						}
						break;

						case "text":
						tempPage.template = "text.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = ""+ newPageProperties['media'];
						tempPage.title = "" + newPageProperties['title'];
						var textFilePath = basepath+"/src/"+tempPage.path.dir+"/assets/"+i+".txt";
						var data  = fs.readFileSync(textFilePath,'utf8');
						tempPage.words = converter.makeHtml(data);
						break;

						case "vimeo":
						tempPage.template = "vimeo.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = ""+ newPageProperties['media'];
						tempPage.title = "" + newPageProperties['title'];
						tempPage.vimeoID = "" + newPageProperties['vimeoID'];
 						break;

 						case "youtube":
						tempPage.template = "youtube.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = ""+ newPageProperties['media'];
						tempPage.title = "" + newPageProperties['title'];
						tempPage.youtubeID = "" + newPageProperties['youtubeID'];
 						break;

						case "audio":
						tempPage.template = "audio.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = ""+ newPageProperties['media'];
						tempPage.mejsPadding = '5';
						tempPage.title = "" + newPageProperties['title'];
						break;

						case "slideshow":
						tempPage.template = "slideshow.hbs";
						var mySlides = newPageProperties['slides'];
						tempPage.slides = mySlides;
						break;

						default:
						tempPage.template = "page.hbs";
						tempPage.description = ""+ newPageProperties['description'];
						tempPage.media = "" + newPageProperties['media'];
						tempPage.title = "" + newPageProperties['title'];
					}
									
					var tempFileName = fileObject.path.dir+'\/'+i+'.md';
					files[tempFileName] = tempPage;
				}

				//now that we have created and added the new pages we can delete the original page 
				delete files[file];
				
			}

		}

    	done();
	};

};


var studentDirectory = function(options){
	
	//this plugin just gives us a variable for making the student index properly

	return function (files, metalsmith, done){
		
		console.log("Setting variable for student directory (index) page....".yellow);
		var metadata = metalsmith._metadata;
		var numStudents = metadata.students.length;
		var numStudentsEachCol = Math.ceil(numStudents/4);

		for(var file in files){

			var fileObject = files[file];
			if(fileObject.title == 'index'){
				fileObject.numStudents = numStudents;
				fileObject.numStudentsEachCol = numStudentsEachCol;
				files[file] = fileObject;
			}
		}


    	done();
	};

};


var nextStudent = function(options){

	//This function is to make the next student accessible in the top nav
	// it relies on the pages having data from collections and path plugins 

	return function (files, metalsmith, done){

      console.log('Configuring inter-student navigations...'.yellow);
	var firstStudentPath, lastStudentPath, firstStudent, lastStudent;
      console.log('finding first student...'.green);
        // Loop through files
        Object.keys(files).forEach(function(file){
            // Create a new file with the contents of the original
            var fileObject = files[file];

            //find files with only next (first student)
            if(fileObject.next && (fileObject.previous == undefined)){
            	console.log('first student found: ' + fileObject.name);
            	firstStudentPath = fileObject.path;
                  firstStudent = fileObject;

            	if(lastStudentPath == undefined){
            		//in this case, we still need to find the last student!
            		console.log('finding last student...'.green);

            		Object.keys(files).forEach(function(file2){

            			var nextFile = files[file2];

            			if(nextFile.previous && (nextFile.next == undefined)){
            				console.log('last student found: '+ nextFile.name);
            				lastStudentPath = nextFile.path;
                                    lastStudent = nextFile;
                                    nextFile.next = firstStudent;

            			}
            		});

            		fileObject.previous = lastStudent;

            	}


            	files[file] = fileObject;

            }
            

        });


console.log('Building links...'.yellow);

        //NOW EVERYTHING should have a previous and next, set 'Child' Pages.
        Object.keys(files).forEach(function(file){
            // Create a new file with the contents of the original
            var fileObject = files[file];

            //find files in the collection with next base and previous
            if(fileObject.previous && fileObject.next){

            	var nextStudentPath = fileObject.next.path;
            	var previousStudentPath = fileObject.previous.path;

            	fileObject.nextStudentPath = nextStudentPath;
            	fileObject.previousStudentPath = previousStudentPath;

            	var baseDir = fileObject.path.dir;

				//find files with same path base.dir

				Object.keys(files).forEach(function(file2){
					var nextFile = files[file2];
					if(nextFile.path.dir == fileObject.path.dir){
						if(nextFile.path.base != fileObject.path.base){
						//add the href and previous for them as well
						nextFile.nextStudentPath = nextStudentPath;
						nextFile.previousStudentPath = previousStudentPath;
						files[file2] = nextFile;
					}
				}
			});
				files[file] = fileObject;

			}

		});

done();
};

};




///expose plugin
module.exports = {
	makePages,
	nextStudent,
	studentDirectory
}