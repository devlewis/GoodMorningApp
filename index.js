"use strict";

function watchForm() {
  $("form").submit(event => {
    event.preventDefault();
    const country = $("#js-country")
      .val()
      .toLowerCase()
      .trim();
    getCountryFromApi(country);
    $("#js-error-message").empty();
  });
}

$(getAllCountries);
$(watchForm);

let name;

//////// Render Functions /////////

//1. displays "Good morning, my name is" in selected country's language
function displayTranslationResults(translationResults, countryData, language) {
  $("#input-section").addClass("hidden");

  let countryName = countryData.name;
  name = $("#js-name").val();

  $("#results").append(
    `<p id="response">${translationResults.data.translations[0].translatedText} ${name}!</p>
      <p class="small">"Good morning! My name is ${name}!"
          <br></br>
    <form action="https://translate.google.com/#view=home&op=translate&sl=en&tl=${language}" method="get" target="_blank">
    <button type="submit" class="gtbutton">More Phrases to use in ${countryName}</button>`
  );
  $("#results").removeClass("hidden");
}

//2. displays current time and alternate phrases in country selected,
//as well as action buttons to restart the app.
let displayTimeResults = (
  longFormTime,
  countryCapital,
  countryName,
  translationResults
) => {
  let actualTime = longFormTime.datetime;
  let actualTimeString = actualTime.toString();
  let actualTimeShort = actualTimeString.substring(11, 16);
  if (countryCapital === "") {
    $("#timeresults").append(
      `<p class="small">It's actually ${actualTimeShort} in ${countryName}.</p>`
    );
  } else {
    $("#timeresults").append(
      `<p class="small">It's actually ${actualTimeShort} in
           ${countryCapital}, capital city of ${countryName}.</p>`
    );
  }
  $("#timeresults").append(
    `<p class="small">Maybe you need:<br> 
  ${translationResults.data.translations[1].translatedText}<br>(Good afternoon!)
  <br>or</br> 
  ${translationResults.data.translations[2].translatedText}<br>(Good evening!) ?</p>
  <br></br>
  <button class="gtbutton" id="restart">Wake up somewhere else!</button>`
  );
  $("#timeresults").removeClass("hidden");
};

//3. clears form and restarts app, re-populating the name input
function restartButton() {
  $("#restart").click(event => {
    event.preventDefault();
    $("#results").empty();
    $("#timeresults").empty();
    $("html").removeClass("second-background");
    $("html").addClass("first-background");
    $("#input-section").removeClass("hidden");
    $("header").removeClass("hidden");
    $("body").removeClass("centered");
    $("footer").removeClass("hidden");
    $("#js-name").val(name);
    $("#js-country")
      .val("")
      .addClass("cursor");
  });
}

//4. full list of countries from REST countries API for country select
function makeCountryList(responseJson) {
  let countryList = responseJson.forEach(item =>
    $("#countries").append(`<option value="${item.name}">`)
  );
  return countryList;
}

//5. removes blinking "caret" when user enters name and country
function removeCursorName() {
  $("#js-name").removeClass("cursor");
}

function removeCursorCountry() {
  $("#js-country").removeClass("cursor");
}

/////////API fetch functions///////////

//takes timezone of capital city from timeZoneApi1 and returns current time in that zone
let timeZoneApi2 = timeZoneName => {
  let timeZone = timeZoneName.timeZoneId;
  return request("https://worldtimeapi.org/api/timezone/" + timeZone);
};

//takes lat/long of capital city from geoCodeCapitalAPI and returns timezone of city
let timeZoneApi1 = geoCode => {
  let lat = geoCode.results[0].geometry.location.lat;
  let long = geoCode.results[0].geometry.location.lng;
  const timeStamp = Date.now();
  const timeStampString = timeStamp.toString();
  let timeStampShort = timeStampString.substring(0, timeStampString.length - 3);
  return request(
    "https://maps.googleapis.com/maps/api/timezone/json?location=" +
      lat +
      "," +
      long +
      "&timestamp=" +
      timeStampShort +
      `&key=${GOOGLE_API_TOKEN}`
  );
};

//takes name of country's capital city and returns lat/long
let geoCodeCapitalApi = translateData => {
  let countryCapital = translateData.capital;
  let countryCode = translateData.alpha2Code;
  let options = [];

  return request(
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      countryCapital +
      "&components=country:" +
      countryCode +
      `&key=${GOOGLE_API_TOKEN}`,
    options
  );
};

//takes language of country and returns phrases in that language
function googleTranslateApi(countryData) {
  let language = countryData.languages[0];

  if (language === "dz") {
    languageError();
    language = "ne";
  }

  const data1 = {
    q: ["Good Morning! My name is", "Good afternoon!", "Good evening!"],
    target: language
  };

  const options1 = {
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    method: "POST",
    body: JSON.stringify(data1)
  };

  return request(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_TOKEN}`,
    options1
  ).then(translationResults => {
    displayTranslationResults(translationResults, countryData, language);
    return translationResults;
  });
}

//an exception message for the language Dzongkha, not found in googleTranslate
function languageError() {
  $("#results").append(
    `<p class="small">Sorry, there's no Google translation for Dzongkha, Bhutan's principal language; 
      but you may be able to use Nepali phrases!</p>
      
      <p class="small">Nepali:</p>`
  );
}

//takes raw REST Countries API data (can return multiple countries) and returns exact country requested
function findCountry(rawCountryData, country) {
  let countryData;

  if (
    rawCountryData.find(
      ({ name }) => name.toLowerCase() === country.toLowerCase()
    )
  ) {
    countryData = rawCountryData.find(
      ({ name }) => name.toLowerCase() === country.toLowerCase()
    );
  } else {
    countryData = rawCountryData.find(({ name }) =>
      name.toLowerCase().includes(name.toLowerCase())
    );
  }

  return countryData;
}

//takes country name input and returns country data object, including principal language and capital city;
//triggers promise chain of the other API fetch functions

function getCountryFromApi(country) {
  const url = "https://restcountries-v1.p.rapidapi.com/name/" + country;

  const options = {
    headers: new Headers({
      "x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
      "x-rapidapi-key": "COUNTRIES_API_TOKEN"
    })
  };

  request(url, options)
    .then(rawCountryData => {
      let translateRes, geoCodeRes, timeZone1Res, timeZone2Res;

      let countryData = findCountry(rawCountryData, country);

      $("html").removeClass("first-background");
      $("html").addClass("second-background");

      const googleTranslatePromise = googleTranslateApi(countryData).then(
        res => {
          translateRes = res;
          console.log(res);
        }
      );

      const geoCodingPromise = geoCodeCapitalApi(countryData)
        .then(res => {
          geoCodeRes = res;
          return timeZoneApi1(geoCodeRes);
        })
        .then(res => {
          timeZone1Res = res;
          return timeZoneApi2(timeZone1Res);
        })
        .then(res => {
          timeZone2Res = res;
        });

      Promise.all([googleTranslatePromise, geoCodingPromise]).then(() => {
        $("body").addClass("centered");
        let countryCapital = countryData.capital;
        let countryName = countryData.name;
        displayTimeResults(
          timeZone2Res,
          countryCapital,
          countryName,
          translateRes
        );
        restartButton();
        $("header").addClass("hidden");
        $("footer").addClass("hidden");
      });
    })
    .catch(err => {
      $("#js-error-message").append(err.message);
    });
}

//returns all countries in REST Countries API database, for use in input drop-down list
function getAllCountries() {
  const url = "https://restcountries-v1.p.rapidapi.com/all";

  const options = {
    headers: new Headers({
      "x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
      "x-rapidapi-key": "COUNTRIES_API_TOKEN"
    })
  };
  fetch(url, options)
    .then(res => res.json())
    .then(responseJson => console.log(responseJson));
}

//general request fetch function used in all API functions
function request(url, options) {
  return fetch(url, options).then(res1 => {
    //Error for being offline
    if (res1.status == 404) {
      $("#js-country").addClass("cursor");
      throw new Error(
        "Something's wrong; the server may be unavailable. Please enter a valid country name as found in the dropdown list or try again later."
      );
    }
    //investigate if API calls error
    else if (!res1.ok) {
      throw new Error(
        "There was a problem making the request; please try again at a later time."
      );
    } else {
      return res1.json();
    }
  });
}
