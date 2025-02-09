const { Sigaa } = require("sigaa-api");

const sigaa = new Sigaa({
  url: "https://sigaa.ifsc.edu.br"
});
let result = sigaa.search.subject()

async function main() {
  // get Campus List to find out your Campus' index. 
  const campusList = await result.getCampusList();

  const campus = campusList[4];
  const jsonsify = true;
  const year = 2023;
  const period = 1;

  const subjects = await result.search(jsonsify, campus, year, period);

  // get all subjects from your search.
  console.log('Lista de campus');
  subjects.map(subject => {
    console.log(`\n${subject.id} - ${subject.name}`);
    console.log(`Turmas:`);
    subject.teams.map(team => {
      console.log(`  Código: ${team.id}`);
      console.log(`  Docente: ${team.teacher}`);
      console.log(`  Local: ${team.location}`);
      if (team.schedule) {
        console.log(`  Horário: ${team.schedule}`);
      }
      console.log(``);
    });
  })
}


main().catch((err) => {
  if (err) console.log(err);
});
