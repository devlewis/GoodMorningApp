'use strict';

function watchForm(){
  $('form').submit(event => {
    event.preventDefault();
    const country = $('#js-country').val();
    getCountryFromApi(country);
  });
}

$(watchForm);

// Render Functions
function refreshButton(){
  $('refresh').submit(event => {
    event.preventDefault();
    $('#results').addClass('hidden');
    $('#input-section').removeClass('hidden');
    watchForm();
  })
}

var displayTimeResults = ((longFormTime,countryCapital,translationResults) => {
  console.log(longFormTime);
  console.log(countryCapital);
  console.log(translationResults);
  let actualTime = longFormTime.datetime;
  let actualTimeString = actualTime.toString();
  let actualTimeShort = actualTimeString.substring(11,16);
  console.log(actualTimeShort);
$('#input-section').addClass('hidden');
$('#timeresults').empty();
$('#timeresults').removeClass('hidden');
$('#timeresults').append(
    `<p>It's actually ${actualTimeShort}in
         ${countryCapital}. Maybe you need 
         ${translationResults.data.translations[1].translatedText} (Good afternoon!) or 
         ${translationResults.data.translations[2].translatedText} (Good evening!) ?</p>
         
         <button class="refresh">I want to wake up somewhere else!</button>`
  );
 refreshButton(); 
})

function displayTranslationResults(translationResults) {
  console.log(translationResults);

  const name = $("#js-name").val();

  $("#results").empty();
  $("#results").append(
    `<p>${translationResults.data.translations[0].translatedText} ${name}!!!!!</p>`
  );
  $("#results").removeClass("hidden");
}


// API Call Functions

var timeZone2 = (timeZoneName) => {
  console.log(timeZoneName);
  let timeZone = timeZoneName.timeZoneId;
  console.log(timeZone);
  return request("https://worldtimeapi.org/api/timezone/"+timeZone)
}

//runs 5th
var timeZone1 = geoCode => {
  console.log(geoCode)
  let lat=geoCode.results[0].geometry.location.lat;
  let long=geoCode.results[0].geometry.location.lng;
  const timeStamp = Date.now();
  const timeStampString = timeStamp.toString();
  let timeStampShort= timeStampString.substring(0, (timeStampString.length)-3);
  return request("https://maps.googleapis.com/maps/api/timezone/json?location="+lat+","+long+"&timestamp="+timeStampShort+"&key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks")
}

//runs fourth
var geoCoding = translateData => {
  let countryCapital=translateData[0].capital;
  let countryCode=translateData[0].alpha2Code;
  let options = [];

  return request("https://maps.googleapis.com/maps/api/geocode/json?address="+countryCapital+"&components=country:"+countryCode+"&key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks", options)
}

//triggers displayTranslationResults() and geoCoding() 
function googleTranslate(translateData) {
   console.log(translateData);

   let language = translateData[0].languages[0];
   console.log(language);

   const data1 = {
    "q": ["Good Morning! My name is", "Good afternoon!", "Good evening!"],
    "source": "en",
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
      displayTranslationResults(translationResults);
      return translationResults;    
    });
}

//runs first, sends data to googleTranslate and geoCoding
function getCountryFromApi(country) {

const url = "https://restcountries-v1.p.rapidapi.com/name/"+country;

console.log(url);

  const options = {
    headers: new Headers({
    "x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
	  "x-rapidapi-key": "ebaaafd4d3msh752c26791113a7fp144b54jsn7740997f5edd"
  })}

  request(url, options).then((countryData) => {
    let translateRes, geoCodeRes, timeZone1Res, timeZone2Res;

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
        let countryCapital = countryData[0].capital;
        displayTimeResults(timeZone2Res,countryCapital,translateRes)
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
