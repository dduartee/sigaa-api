const { Sigaa } = require('sigaa-api');

const sigaa = new Sigaa({
  url: 'https://sigaa.ifsc.edu.br',
  institution: 'IFSC'
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
  const bonds = await account.getActiveBonds(); // pega os vinculos ativos

  //Para cada vínculo
  for (const bond of bonds) {
    if (bond.type !== 'student') continue; // O tipo pode ser student ou teacher

    //Se o tipo do vínculo for student, então tem matrícula e curso
    console.log('Matrícula do vínculo: ' + bond.registration);
    console.log('Curso do vínculo: ' + bond.program);

    // Se for usado bond.getCourses(true); todas as turmas são retornadas, incluindo turmas de outros semestres
    const courses = await bond.getCourses(); // pega as turmas do vínculo
    const coursesAndGrades = await Promise.all(
      courses.map(async (course) => {
        const sigaaInstanceOfCourse = new Sigaa({
          url: 'https://sigaa.ifsc.edu.br'
        });
        // pega as notas de cada turma simultaneamente
        console.log('Logando para a turma: ' + course.title);
        const account = await sigaaInstanceOfCourse.login(username, password); // login 
        const bonds = await account.getActiveBonds();
        const bondOfCourse = bonds.filter(
          (b) => b.type === 'student' && b.registration === bond.registration
        )[0]; // pega o vinculo da turma
        const courses = await bondOfCourse.getCourses();
        const courseSelected = courses.filter((c) => c.id === course.id)[0]; // pega a turma especificada
        console.log('Pegando notas da turma: ' + courseSelected.title);
        const gradesGroups = await courseSelected.getGrades(); // pega as notas da turma
        account.logoff(); // desloga
        return {
          course: courseSelected,
          gradesGroups
        };
      })
    );

    for (const courseAndGrades of coursesAndGrades) {
      const { course, gradesGroups } = courseAndGrades;
      console.log(' > ' + course.title);
      for (const gradesGroup of gradesGroups) {
        console.log('-> ' + gradesGroup.name);
        switch (
          gradesGroup.type //Existem 3 tipos de grupos de notas
        ) {
          // O primiro tipo (only-average) é somente o valor final, mesmo assim, pode ser que o valor ainda seja indefinido
          case 'only-average':
            console.log(gradesGroup.value);
            break;

          // O segundo (weighted-average) é um grupo com notas ponderadas (tem peso), mas os pesos podem serem todos iguais
          case 'weighted-average':
            //Para cada nota do grupo
            for (const grade of gradesGroup.grades) {
              console.log('-' + grade.name);
              // O peso dessa nota
              console.log('peso: ' + grade.weight);
              // O valor dessa nota pode ser também indefinido
              console.log(grade.value);
            }

            // A média final do grupo
            console.log('média:' + gradesGroup.value);

            break;

          // O terceiro (sum-of-grades) é um grupo de soma de notas, não tem peso, mas cada nota tem um valor máximo
          case 'sum-of-grades':
            //Para cada nota do grupo
            for (const grade of gradesGroup.grades) {
              console.log('-' + grade.name);
              // O valor máximo dessa nota
              console.log('Valor máximo: ' + grade.maxValue);
              // O valor dessa nota pode ser também indefinido
              console.log(grade.value);
            }

            // A soma final do grupo
            console.log('soma:' + gradesGroup.value);
            break;
        }
      }
      console.log(''); // Para espaçar as linhas
    }
  }
  // Encerra a sessão
  await account.logoff();
};

main().catch((err) => {
  if (err) console.log(err);
});
