'use strict';

function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    $('#js-error-message').text('');
    $('#timeresults').empty();
    $('#results').empty();
    const country = $('#js-country').val();
    getCountryFromAPI(country);
  });
}

$(watchForm);

//runs 7th
function displayTimeResults(longFormTime) {
  console.log(longFormTime);
  let actualTime = longFormTime.datetime;
  let actualTimeString = actualTime.toString();
  let actualTimeShort = actualTimeString.substring(11, 16);
  console.log(actualTimeShort);
  $('#timeresults').prepend(
    `<p>It's actually ${actualTimeShort} in`
  );
}

//runs 6th
function timeZone2API(timeZoneName) {
  console.log(timeZoneName);
  let timeZone = timeZoneName.timeZoneId;
  console.log(timeZone);
  request("https://worldtimeapi.org/api/timezone/" + timeZone)
    .then(longFormTime => displayTimeResults(longFormTime));
}

//runs 5th
function timeZone1API(geoCode) {
  console.log(geoCode)
  let lat = geoCode.results[0].geometry.location.lat;
  let long = geoCode.results[0].geometry.location.lng;
  const timeStamp = Date.now();
  const timeStampString = timeStamp.toString();
  let timeStampShort = timeStampString.substring(0, (timeStampString.length) - 3);
  request("https://maps.googleapis.com/maps/api/timezone/json?location=" + lat + "," + long + "&timestamp=" + timeStampShort + "&key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks")
    .then(timeZoneName => timeZone2API(timeZoneName));
}

//runs fifth
function geoCodingAPI(countryData) {
  let countryCapital = countryData.capital;
  let countryCode = countryData.alpha2Code;
  let options = [];

  request("https://maps.googleapis.com/maps/api/geocode/json?address=" + countryCapital + "&components=country:" + countryCode + "&key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks", options)
    .then(geoCode => timeZone1API(geoCode));
}

//runs fourth
function displayTranslationResults(countryData, translationResults, language) {
  console.log(translationResults);
  console.log(language);
  let countryCapital = countryData.capital;
  let countryName = countryData.name;

  const name = $('#js-name').val();

  $('#results').append(
    `<p>${translationResults.data.translations[0].translatedText} ${name}!</p>
    <p class="small">Good morning! My name is ${name}!</p>
    <br></br>
    <form action="https://translate.google.com/#view=home&op=translate&sl=${language}&tl=en" method="get" target="_blank">
    <button type="submit">More Phrases to use in ${countryName}</button>`);
  $('#results').removeClass('hidden');
  $('#timeresults').append(`    
    ${countryCapital}, capital city of ${countryName}.</p> 
    <p>Maybe you need 
    ${translationResults.data.translations[1].translatedText} (Good afternoon!) or 
    ${translationResults.data.translations[2].translatedText} (Good evening!) ?</p>`
  );
  $('#timeresults').removeClass('hidden');
}

function languageError(){
    $('#results').append(
      `<p>Sorry, there's no translation for Bhutan's principal language, Dzongkha; 
      but you may be able to use Nepali phrases in Bhutan!</p>
      
      <p>Nepali:</p>`
    )
}

//runs third, triggers displayTranslationResults()  
function googleTranslateAPI(countryData, language) {
  console.log(countryData);

  const data1 = {
    "q": ["Good Morning! My name is", "Good afternoon!", "Good evening!"],
    "target": language
  }

  const options1 = {
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    method: "POST",
    body: JSON.stringify(data1)
  }

  request("https://translation.googleapis.com/language/translate/v2?key=AIzaSyDumOtzsZBkWdtNzTDcdsVLKYJ6yJUtkks", options1)
    .then(translationResults => displayTranslationResults(countryData, translationResults, language))
  
}

//runs second, sends country array to googleTranslateAPI() and geoCodingAPI()
function findCountry(rawCountryData) {
  const country1 = $('#js-country').val();

  if (typeof country1 !== 'string') { alert("Please enter a valid country name in English") }
  else {
    const countryCaps = country1.charAt(0).toUpperCase() + country1.slice(1);
    const countryData = rawCountryData.find(({name}) => name === countryCaps)

  let language = countryData.languages[0];
  console.log(language);

  if(language === "dz"){
      languageError();
      language = "ne";
      console.log(language);
      googleTranslateAPI(countryData, language);
      geoCodingAPI(countryData);
      }
  else{
    googleTranslateAPI(countryData, language);
    geoCodingAPI(countryData);
  }}
}

//runs first
function getCountryFromAPI(country) {

  const url = "https://restcountries-v1.p.rapidapi.com/name/" + country;

  console.log(url);

  const options = {
    headers: new Headers({
      "x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
      "x-rapidapi-key": "ebaaafd4d3msh752c26791113a7fp144b54jsn7740997f5edd"
    })
  }

  request(url, options).then(rawCountryData => 
    findCountry(rawCountryData))
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

