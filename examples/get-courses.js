const { Sigaa } = require('sigaa-api');

const sigaa = new Sigaa({
  url: 'https://sigaa.ifsc.edu.br'
});

// coloque seu usuário
const username = '';
const password = '';

const main = async () => {
  const account = await sigaa.login(username, password); // login

  /**
   * O usuário pode ter mais de um vínculo
   * @see https://github.com/GeovaneSchmitz/sigaa-api/issues/4
   **/
  const bonds = await account.getActiveBonds()
  
  //Para cada vínculo
  for (const bond of bonds) {
    if (bond.type !== 'student') continue; // O tipo pode ser student ou teacher
    
    
    //Se o tipo do vínculo for student, então tem matrícula e curso
    console.log(`Matrícula do vínculo: ${bond.registration}`);
    console.log(`Curso do vínculo: ${bond.program}`);

    const period = await bond.getCurrentPeriod();
    console.log(`Período do vínculo: ${period}`);

    const campus = await bond.getCampus();
    console.log(`Campus do vínculo: ${campus}`);

    // Se for usado bond.getCourses(true); todas as turmas são retornadas, incluindo turmas de outros semestres
    const courses = await bond.getCourses();

    // Para cada turma
    for (const course of courses) {
      // Nome da turma
      console.log(' > ' + course.title);
      // Semestre
      console.log(course.period);
      // Horário das aulas
      console.log(course.schedule);
      console.log(''); // Apenas para separar as linhas
    }
  }

  // Encerra a sessão
  await account.logoff();
};

main().catch((err) => {
  if (err) console.log(err);
});