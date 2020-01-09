const url = "https://restcountries-v1.p.rapidapi.com/all"

const options = {
    headers: new Headers({
      "x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
      "x-rapidapi-key": "ebaaafd4d3msh752c26791113a7fp144b54jsn7740997f5edd"
    })
  }

fetch(url, options)
  .then(res => res.json())
  .then(responseJson => makeCountryList(responseJson))

function makeCountryList(responseJson){
    let countryList = responseJson.forEach(item => 
        $(#countries).append(`<option value="${item.name}">`));
    console.log("countryLibrary", countryLibrary);
    return countryList;
}
