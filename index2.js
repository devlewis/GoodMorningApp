'use strict';

function watchForm(){
  $('form').submit(event => {
    event.preventDefault();
    const country = $('#js-country').val().toLowerCase().trim();
    console.log("in watchForm", country);
    getCountryFromApi(country);
    $("body").addClass("turnblue");
    $("html").removeClass("yellow");
  });
}

$(watchForm);

// Render Functions

function displayTranslationResults(translationResults,countryData,language) {
    console.log(translationResults);
    console.log("in display countryData", countryData)
    
    $("#input-section").addClass("hidden");
    const name = $("#js-name").val();
    let countryName = countryData.name;
  
    $("#results").append(
      `<p>${translationResults.data.translations[0].translatedText} ${name}!</p>
      <p class="small">Good morning! My name is ${name}!
          <br></br>
    <form action="https://translate.google.com/#view=home&op=translate&sl=en&tl=${language}" method="get" target="_blank">
    <button type="submit" class="gtbutton">More Phrases to use in ${countryName}</button>`);
    $("#results").removeClass("hidden");
  }

  var displayTimeResults = ((longFormTime,countryCapital,countryName,translationResults) => {
    console.log(longFormTime);
    console.log(countryCapital);
    console.log(translationResults);
    let actualTime = longFormTime.datetime;
    let actualTimeString = actualTime.toString();
    let actualTimeShort = actualTimeString.substring(11,16);
    console.log(actualTimeShort);
  $('#timeresults').append(
      `<p class="small">It's actually ${actualTimeShort} in
           ${countryCapital}, capital city of ${countryName}.</p> 
       <p class="small">Maybe you need:<br> 
           ${translationResults.data.translations[1].translatedText}<br>(Good afternoon!)
       <br>or</br> 
       ${translationResults.data.translations[2].translatedText}<br>(Good evening!) ?</p>
       <br></br>
       <button class="gtbutton" id="restart">Wake up somewhere else!</button>`
    );
  restartButton();
  $('#timeresults').removeClass('hidden');
  })  


function restartButton(){
    $("#restart").click(event => {
        console.log("click");
        event.preventDefault(); 
        $("#results").empty();
        $("#timeresults").empty();
        $("body").removeClass("turnblue");
        $("html").addClass("yellow");
        $("#input-section").removeClass("hidden");
        document.getElementById("js-form").reset();
        }
    )
}

//API fetch functions

var timeZone2 = (timeZoneName) => {
  console.log(timeZoneName);
  let timeZone = timeZoneName.timeZoneId;
  console.log(timeZone);
  return request("https://worldtimeapi.org/api/timezone/"+timeZone)
}


var timeZone1 = geoCode => {
  console.log(geoCode)
  let lat=geoCode.results[0].geometry.location.lat;
  let long=geoCode.results[0].geometry.location.lng;
  const timeStamp = Date.now();
  const timeStampString = timeStamp.toString();
  let timeStampShort= timeStampString.substring(0, (timeStampString.length)-3);
  return request("https://maps.googleapis.com/maps/api/timezone/json?location="+lat+","+long+"&timestamp="+timeStampShort+"&key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks")
}

var geoCoding = translateData => {
  let countryCapital=translateData.capital;
  let countryCode=translateData.alpha2Code;
  let options = [];

  return request("https://maps.googleapis.com/maps/api/geocode/json?address="+countryCapital+"&components=country:"+countryCode+"&key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks", options)
}

function googleTranslate(countryData) {
   console.log("ingoogleTranslate countryData",countryData);
   let language = countryData.languages[0]   
   
    if(language === "dz"){
    languageError();
    language = "ne";
    console.log(language);
        }

   console.log(language);

   const data1 = {
    "q": ["Good Morning! My name is", "Good afternoon!", "Good evening!"],
    "target": language
   } 

   const options1 = {
    headers: new Headers({
        "Content-Type":"application/json"
        }),
    method: "POST",
    body: JSON.stringify(data1)
   } 
     
  return request("https://translation.googleapis.com/language/translate/v2?key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks", options1)
    .then(translationResults => {
      displayTranslationResults(translationResults,countryData,language);
     return translationResults;    
    });
}

function languageError(){
    $('#results').append(
      `<p class="small">Sorry, there's no google translation for Bhutan's principal language, Dzongkha; 
      but you may be able to use Nepali phrases in Bhutan!</p>
      
      <p class="small">Nepali:</p>`
    )
}

function findCountry(rawCountryData, country) {
    console.log("in findCountry", rawCountryData);
    let language; 
    let countryData;

    if (typeof country !== 'string') {alert("Please enter a valid country name in English")}
    else {
      let countryCaps = country.split(" ");
          console.log("before if block", countryCaps)   
        if(countryCaps.length > 1){
          countryCaps = countryCaps.map(word => word.charAt(0).toUpperCase() + word.slice(1));
          countryCaps = countryCaps.join(" ");
          console.log("in if block countryCaps", countryCaps);}
        else{countryCaps = (countryCaps.toString().charAt(0).toUpperCase() + countryCaps.toString().slice(1))
          console.log("in else block countryCaps", countryCaps);};  
          

      countryData = rawCountryData.find(({name}) => name === countryCaps)
  
    language = countryData.languages[0];
    console.log(language);}

    return countryData;
}

function getCountryFromApi(country) {

const url = "https://restcountries-v1.p.rapidapi.com/name/"+country;

console.log(url);

  const options = {
    headers: new Headers({
    "x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
	  "x-rapidapi-key": "ebaaafd4d3msh752c26791113a7fp144b54jsn7740997f5edd"
  })}

  request(url, options)
      .then(rawCountryData => {
         let translateRes, geoCodeRes, timeZone1Res, timeZone2Res;

         let countryData = findCountry(rawCountryData, country)

    const googleTranslatePromise = googleTranslate(countryData)
      .then(res => {
        translateRes = res;
      });
    const geoCodingPromise = geoCoding(countryData)
      .then(res => {
        geoCodeRes = res;
        return timeZone1(geoCodeRes);
      })
      .then(res => {
        timeZone1Res = res;
        return timeZone2(timeZone1Res);
      })
      .then(res => {
        timeZone2Res = res;
      })
    
    Promise.all([googleTranslatePromise, geoCodingPromise])
      .then(() => {
        let countryCapital = countryData.capital;
        let countryName = countryData.name;
        displayTimeResults(timeZone2Res,countryCapital,countryName,translateRes)
      });
  })
}


function request(url, options) {
  return fetch(url, options)
    .then(res1 => {
      if (res1.ok) {
        return res1.json();
      }
      throw new Error(res1.statusText);
    })
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}