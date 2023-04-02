const { Sigaa } = require("sigaa-api");

const sigaa = new Sigaa({
    url: "https://sigaa.unb.br"
});
let result = sigaa.search.subject()

async function main() {
    try {
      // get Campus List to find out your Campus' index. 
      const campusList = await result.getCampusList();
      
      const campus = campusList[78];
      const jsonsify = true;
      const year = 2023;
      const period = 1;
      
      const unb_fga_subjects = await result.search(jsonsify, campus, year, period);

      // get all subjects from your search.
      console.log('Lista de campus');
      console.log(unb_fga_subjects);

      // get all classes/teams from the first subject
      console.log(unb_fga_subjects[1].teams);
    }
    catch (err) {
      console.log(err);
      
    }
}

main()