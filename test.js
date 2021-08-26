function shuffleArray(inputArray){
    inputArray.sort(()=> Math.random() - 0.5);
}

let jobList = [{jobCode:0,jobName:'마피아'},{jobCode:1,jobName:'경찰'},
{jobCode:2,jobName:'의사'},{jobCode:3,jobName:'군인'}];
console.log(jobList);
shuffleArray(jobList);
console.log(jobList);