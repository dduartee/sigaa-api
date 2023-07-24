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
  const bonds = await account.getActiveBonds();

  //Para cada vínculo
  for (const bond of bonds) {
    if (bond.type !== 'student') continue; // O tipo pode ser student ou teacher

    console.log('Matrícula do vínculo: ' + bond.registration);
    console.log('Curso do vínculo: ' + bond.program);
    const activities = await bond.getActivities();

    for (const activity of activities) {
      const date = activity.date;

      switch (activity.type) {
        case 'homework':
          console.log(`${activity.courseTitle} -> ${activity.homeworkTitle}`);
          /** É possivel acessar a tarefa usando:
           * await activity.getHomework();
           * Ou pegar o id da tarefa usando:
           * activity.homeworkId
           **/
          break;
        case 'quiz':
          /**
           * Também, é possivel acessar o quiz usando:
           * await activity.getQuiz();
           * Ou pegar o id do quiz usando:
           * activity.quizId
           **/
          console.log(`${activity.courseTitle} -> ${activity.quizTitle}`);
          break;
        case 'exam':
          /**
           * Da mesma forma, para acessar a avaliação:
           * await activity.getExam();
           **/
          console.log(`${activity.courseTitle} -> ${activity.examDescription}`);
          break;
      }

      /**
       * Para accessar a turma da atividade, você pode usar:
       * await activity.getCourse();
       **/

      /**
       * Se o tipo da atividade for quiz ou homework, você pode pegar o id da turma usando:
       * activity.courseId;
       */

      //Data da atividade
      console.log(
        `Data: ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
      );

      // Retorna verdadeiro se a atividade já foi entregue ou se o prazo da atividade já terminou
      console.log(`Entregue: ${activity.done}`);

      console.log(' '); // Para melhorar a leitura
    }
  }
  return await account.logoff();
};

main().catch((err) => {
  if (err) console.log(err);
});
