document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add direct click handler for priority tab
    const priorityTabBtn = document.querySelector('.tab-btn[data-tab="priority"]');
    priorityTabBtn.addEventListener('click', () => {
        console.log("Priority tab clicked directly");
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        priorityTabBtn.classList.add('active');
        document.getElementById('priority').classList.add('active');
        console.log("Priority tab activated");
    });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            console.log(`Tab clicked: ${tabId}`);
        });
    });
    
    // Process Table Generation
    const fcfsGenerateBtn = document.getElementById('fcfs-generate-btn');
    const sjfGenerateBtn = document.getElementById('sjf-generate-btn');
    const srtfGenerateBtn = document.getElementById('srtf-generate-btn');
    const priorityGenerateBtn = document.getElementById('priority-generate-btn');
    
    fcfsGenerateBtn.addEventListener('click', () => generateProcessTable('fcfs'));
    sjfGenerateBtn.addEventListener('click', () => generateProcessTable('sjf'));
    srtfGenerateBtn.addEventListener('click', () => generateProcessTable('srtf'));
    priorityGenerateBtn.addEventListener('click', () => generateProcessTable('priority'));
    
    // Calculate Buttons
    const fcfsCalculateBtn = document.getElementById('fcfs-calculate-btn');
    const sjfCalculateBtn = document.getElementById('sjf-calculate-btn');
    const srtfCalculateBtn = document.getElementById('srtf-calculate-btn');
    const priorityCalculateBtn = document.getElementById('priority-calculate-btn');
    
    fcfsCalculateBtn.addEventListener('click', calculateFCFS);
    sjfCalculateBtn.addEventListener('click', calculateSJF);
    srtfCalculateBtn.addEventListener('click', calculateSRTF);
    
    const priorityClone = priorityCalculateBtn.cloneNode(true);
    priorityCalculateBtn.parentNode.replaceChild(priorityClone, priorityCalculateBtn);
    
    // Set direct onclick handler
    document.getElementById('priority-calculate-btn').onclick = function() {
        console.log("Priority calculate button clicked via onclick");
        calculatePriority();
        return false; // Prevent default action
    };
    
    generateProcessTable('fcfs');
    generateProcessTable('sjf');
    generateProcessTable('srtf');
    generateProcessTable('priority');
});

// Generate process input table based on number of processes
function generateProcessTable(algorithm) {
    const processCount = parseInt(document.getElementById(`${algorithm}-process-count`).value);
    const tableContainer = document.getElementById(`${algorithm}-process-table`);
    
    // Make Table
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Process ID</th>
                    <th>Arrival Time</th>
                    <th>Burst Time</th>
                    ${algorithm === 'priority' ? '<th>Priority</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;
    
    // Make Rows
    for (let i = 0; i < processCount; i++) {
        tableHTML += `
            <tr>
                <td>P${i+1}</td>
                <td><input type="number" id="${algorithm}-arrival-${i+1}" value="${i}" min="0"></td>
                <td><input type="number" id="${algorithm}-burst-${i+1}" value="${Math.floor(Math.random() * 10) + 1}" min="1"></td>
                ${algorithm === 'priority' ? `<td><input type="number" id="${algorithm}-priority-${i+1}" value="${Math.floor(Math.random() * 5) + 1}" min="1"></td>` : ''}
            </tr>
        `;
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// Process class to store process details
class Process {
    constructor(pid, arrivalTime, burstTime, priority = 0) {
        this.pid = pid;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.remainingTime = burstTime; // For SRTF
        this.startTime = 0;
        this.completionTime = 0;
        this.turnaroundTime = 0;
        this.waitingTime = 0;
        this.responseTime = 0;
    }
}

// Gnatt chart colors
const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#e67e22'
];

// Helper function to validate input
function validateInput(value, fieldName) {
    // Special logging for priority fields
    if (fieldName.includes('Priority')) {
        console.log(`Validating ${fieldName} with value: "${value}"`);
    }
    
    if (value === '' || isNaN(value)) {
        if (fieldName.includes('Priority')) {
            console.log(`${fieldName} validation failed: Not a number`);
        }
        return {
            isValid: false,
            message: `Please enter a valid number for ${fieldName}`
        };
    }
    
    const num = parseFloat(value);
    if (!Number.isInteger(num)) {
        if (fieldName.includes('Priority')) {
            console.log(`${fieldName} validation failed: Not an integer`);
        }
        return {
            isValid: false,
            message: `${fieldName} must be a whole number`
        };
    }
    
    if (num < 0) {
        if (fieldName.includes('Priority')) {
            console.log(`${fieldName} validation failed: Negative value`);
        }
        return {
            isValid: false,
            message: `${fieldName} cannot be negative`
        };
    }
    
    if (fieldName.includes('Priority')) {
        console.log(`${fieldName} validation passed with value: ${num}`);
    }
    
    return {
        isValid: true,
        value: num
    };
}

// Helper function to get process data from input fields
function getProcessData(algorithm) {
    const processCount = parseInt(document.getElementById(`${algorithm}-process-count`).value);
    if (isNaN(processCount) || processCount < 1) {
        showError(algorithm, "Please enter a valid number of processes");
        return null;
    }
    const processes = [];
    for (let i = 1; i <= processCount; i++) {
        const pid = i;
        const arrivalTime = parseInt(document.getElementById(`${algorithm}-arrival-${i}`).value);
        const burstTime = parseInt(document.getElementById(`${algorithm}-burst-${i}`).value);
        const priority = algorithm === 'priority' ? parseInt(document.getElementById(`${algorithm}-priority-${i}`).value) : 0;
        if (isNaN(arrivalTime) || isNaN(burstTime) || (algorithm === 'priority' && isNaN(priority))) {
            showError(algorithm, `Please enter valid numbers for Process ${i}`);
            return null;
        }
        processes.push({
            pid: pid,
            arrivalTime: arrivalTime,
            burstTime: burstTime,
            priority: priority,
            startTime: 0,
            completionTime: 0,
            turnaroundTime: 0,
            waitingTime: 0,
            responseTime: 0
        });
    }
    return processes;
}

// Function to show error message
function showError(algorithm, message) {
    const resultsDiv = document.getElementById(`${algorithm}-results`);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error message
    const existingError = resultsDiv.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Show results div and add error message
    resultsDiv.style.display = 'block';
    resultsDiv.insertBefore(errorDiv, resultsDiv.firstChild);
    
    // Hide other results
    const ganttChart = document.getElementById(`${algorithm}-gantt-chart`);
    const resultTable = document.getElementById(`${algorithm}-result-table`);
    const metrics = document.getElementById(`${algorithm}-metrics`);
    
    ganttChart.style.display = 'none';
    resultTable.style.display = 'none';
    metrics.style.display = 'none';
}

// Function to clear error message
function clearError(algorithm) {
    const resultsDiv = document.getElementById(`${algorithm}-results`);
    const errorDiv = resultsDiv.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    
    // Show all results
    const ganttChart = document.getElementById(`${algorithm}-gantt-chart`);
    const resultTable = document.getElementById(`${algorithm}-result-table`);
    const metrics = document.getElementById(`${algorithm}-metrics`);
    
    ganttChart.style.display = 'block';
    resultTable.style.display = 'table';
    metrics.style.display = 'block';
}

// FCFS 
function calculateFCFS() {
    const processes = getProcessData('fcfs');
    if (processes) {
        clearError('fcfs');
    
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    let currentTime = 0;
    
    // Calculate start time, completion time, etc. for each process
    for (let i = 0; i < processes.length; i++) {
        // If there's a gap between processes
        if (currentTime < processes[i].arrivalTime) {
            currentTime = processes[i].arrivalTime;
        }
        
        processes[i].startTime = currentTime;
        currentTime += processes[i].burstTime;
        processes[i].completionTime = currentTime;
        processes[i].turnaroundTime = processes[i].completionTime - processes[i].arrivalTime;
        processes[i].waitingTime = processes[i].turnaroundTime - processes[i].burstTime;
        processes[i].responseTime = processes[i].startTime - processes[i].arrivalTime;
    }
    
    displayResults(processes, 'fcfs');
    }
}

// SJF (Non-preemptive)
function calculateSJF() {
    const processes = getProcessData('sjf');
    if (processes) {
        clearError('sjf');
    
    // Create a copy of processes to track completed processes
    const remainingProcesses = [...processes];
    const completedProcesses = [];
    
    let currentTime = 0;
    
    // Continue until all processes are completed
    while (remainingProcesses.length > 0) {
        // Find ready processes (arrived by current time)
        const readyProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
        
        if (readyProcesses.length === 0) {
            // No process is ready, jump to next arrival time
            remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
            currentTime = remainingProcesses[0].arrivalTime;
            continue;
        }
        
        // Find the process with shortest burst time
        readyProcesses.sort((a, b) => {
            if (a.burstTime === b.burstTime) {
                return a.arrivalTime - b.arrivalTime; // If burst times are equal, sort by arrival time
            }
            return a.burstTime - b.burstTime;
        });
        
        const shortestJob = readyProcesses[0];
        const index = remainingProcesses.findIndex(p => p.pid === shortestJob.pid);
        
        // Execute process
        shortestJob.startTime = currentTime;
        currentTime += shortestJob.burstTime;
        shortestJob.completionTime = currentTime;
        shortestJob.turnaroundTime = shortestJob.completionTime - shortestJob.arrivalTime;
        shortestJob.waitingTime = shortestJob.turnaroundTime - shortestJob.burstTime;
        shortestJob.responseTime = shortestJob.startTime - shortestJob.arrivalTime;
        
        // Move from remaining to completed
        completedProcesses.push(shortestJob);
        remainingProcesses.splice(index, 1);
    }
    
    // Sort completed processes by PID for display
    completedProcesses.sort((a, b) => a.pid - b.pid);
    
    displayResults(completedProcesses, 'sjf');
    }
}

// SRTF (Preemptive)
function calculateSRTF() {
    const processes = getProcessData('srtf');
    if (processes) {
        clearError('srtf');
    
    // Create a deep copy of processes
        const processesDeepCopy = JSON.parse(JSON.stringify(processes));
    
    // Sort by arrival time initially
        processesDeepCopy.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
        const n = processesDeepCopy.length;
    const completed = Array(n).fill(false);
    const ganttChart = [];
    
    let currentTime = 0;
    let completedCount = 0;
    let prevProcessId = -1;
    
    // For tracking execution steps in Gantt chart
    let currentStartTime = 0;
    
    // Initialize remaining time
    for (let i = 0; i < n; i++) {
            processesDeepCopy[i].remainingTime = processesDeepCopy[i].burstTime;
            processesDeepCopy[i].startTime = -1; // -1 means not started yet
    }
    
    // Continue until all processes are completed
    while (completedCount < n) {
        let minRemaining = Number.MAX_VALUE;
        let shortestJobIndex = -1;
        
        // Find the process with the shortest remaining time
        for (let i = 0; i < n; i++) {
                if (!completed[i] && processesDeepCopy[i].arrivalTime <= currentTime) {
                    if (processesDeepCopy[i].remainingTime < minRemaining) {
                        minRemaining = processesDeepCopy[i].remainingTime;
                    shortestJobIndex = i;
                }
                // If remaining times are equal, choose the one that arrived first
                    else if (processesDeepCopy[i].remainingTime === minRemaining && 
                             processesDeepCopy[i].arrivalTime < processesDeepCopy[shortestJobIndex].arrivalTime) {
                    shortestJobIndex = i;
                }
            }
        }
        
        // If no process is available, increment time
        if (shortestJobIndex === -1) {
            currentTime++;
            continue;
        }
        
        // If first time this process is running, set start time
            if (processesDeepCopy[shortestJobIndex].startTime === -1) {
                processesDeepCopy[shortestJobIndex].startTime = currentTime;
        }
        
        // Decrement remaining time of selected process
            processesDeepCopy[shortestJobIndex].remainingTime--;
        
        // For Gantt chart: if the process changed, add an entry
            if (prevProcessId !== processesDeepCopy[shortestJobIndex].pid) {
            if (prevProcessId !== -1) {
                ganttChart.push({
                    pid: prevProcessId,
                    start: currentStartTime,
                    end: currentTime
                });
            }
            currentStartTime = currentTime;
                prevProcessId = processesDeepCopy[shortestJobIndex].pid;
        }
        
        currentTime++;
        
        // If process is completed
            if (processesDeepCopy[shortestJobIndex].remainingTime === 0) {
            completed[shortestJobIndex] = true;
            completedCount++;
            
            // Add to Gantt chart
            ganttChart.push({
                    pid: processesDeepCopy[shortestJobIndex].pid,
                start: currentStartTime,
                end: currentTime
            });
            currentStartTime = currentTime;
            prevProcessId = -1;
            
            // Set completion time
                processesDeepCopy[shortestJobIndex].completionTime = currentTime;
                processesDeepCopy[shortestJobIndex].turnaroundTime = processesDeepCopy[shortestJobIndex].completionTime - processesDeepCopy[shortestJobIndex].arrivalTime;
                processesDeepCopy[shortestJobIndex].waitingTime = processesDeepCopy[shortestJobIndex].turnaroundTime - processesDeepCopy[shortestJobIndex].burstTime;
                processesDeepCopy[shortestJobIndex].responseTime = processesDeepCopy[shortestJobIndex].startTime - processesDeepCopy[shortestJobIndex].arrivalTime;
            }
        }
        
        // Sort by PID for display
        processesDeepCopy.sort((a, b) => a.pid - b.pid);
        
        displayResults(processesDeepCopy, 'srtf', ganttChart);
    }
}


function calculatePriority() {
    try {
        console.log("Priority calculation started");
        
        
        const processCount = parseInt(document.getElementById('priority-process-count').value);
        if (isNaN(processCount) || processCount < 1) {
            showError('priority', "Please enter a valid number of processes");
            return;
        }
        
        console.log("Process count:", processCount);
        
        
        const processes = [];
        for (let i = 1; i <= processCount; i++) {
            const pid = i;
            const arrivalTime = parseInt(document.getElementById(`priority-arrival-${i}`).value);
            const burstTime = parseInt(document.getElementById(`priority-burst-${i}`).value);
            const priority = parseInt(document.getElementById(`priority-priority-${i}`).value);
            
            if (isNaN(arrivalTime) || isNaN(burstTime) || isNaN(priority)) {
                showError('priority', `Please enter valid numbers for Process ${i}`);
                return;
            }
            
            processes.push({
                pid: pid,
                arrivalTime: arrivalTime,
                burstTime: burstTime,
                priority: priority,
                startTime: 0,
                completionTime: 0,
                turnaroundTime: 0,
                waitingTime: 0,
                responseTime: 0
            });
        }
        
        console.log("Process data:", processes);
        
        
        const remainingProcesses = [...processes];
        let completedProcesses = [];
        let currentTime = 0;
        
        
        while (remainingProcesses.length > 0) {
            
            const readyProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
            
            if (readyProcesses.length === 0) {
                
                remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
                currentTime = remainingProcesses[0].arrivalTime;
                continue;
            }
            
            
            readyProcesses.sort((a, b) => {
                if (a.priority === b.priority) {
                    return a.arrivalTime - b.arrivalTime; 
                }
                return a.priority - b.priority; 
            });
            
            const selectedProcess = readyProcesses[0];
            const index = remainingProcesses.findIndex(p => p.pid === selectedProcess.pid);
            
           
            selectedProcess.startTime = currentTime;
            currentTime += selectedProcess.burstTime;
            selectedProcess.completionTime = currentTime;
            selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrivalTime;
            selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
            selectedProcess.responseTime = selectedProcess.startTime - selectedProcess.arrivalTime;
            
            
            completedProcesses.push(selectedProcess);
            remainingProcesses.splice(index, 1);
        }
        
      
        completedProcesses.sort((a, b) => a.pid - b.pid);
        
        console.log("Completed processes:", completedProcesses);
        
        
        clearError('priority');
        
        
        displayResults(completedProcesses, 'priority');
    } catch (error) {
        console.error("Error in priority calculation:", error);
        showError('priority', "An error occurred during calculation. Please check your inputs.");
    }
}

// Function to specifically display priority results
function showPriorityResults(processes) {
    // Show results container
    document.getElementById('priority-results').style.display = 'block';
    
    // Fill table
    const tableBody = document.getElementById('priority-result-table').querySelector('tbody');
    tableBody.innerHTML = '';
    
    processes.forEach(process => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${process.pid}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>${process.priority}</td>
            <td>${process.startTime}</td>
            <td>${process.completionTime}</td>
            <td>${process.turnaroundTime}</td>
            <td>${process.waitingTime}</td>
            <td>${process.responseTime}</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Calculate metrics
    const avgTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / processes.length;
    const avgWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0) / processes.length;
    const avgResponseTime = processes.reduce((sum, p) => sum + p.responseTime, 0) / processes.length;
    
    // Calculate throughput
    const totalTime = Math.max(...processes.map(p => p.completionTime)) - Math.min(...processes.map(p => p.arrivalTime));
    const throughput = (processes.length / totalTime) * 100;
    
    // Display metrics
    const metricsDiv = document.getElementById('priority-metrics');
    metricsDiv.innerHTML = `
        <p>Average Turnaround Time: <span class="highlight">${avgTurnaroundTime.toFixed(2)}</span></p>
        <p>Average Waiting Time: <span class="highlight">${avgWaitingTime.toFixed(2)}</span></p>
        <p>Average Response Time: <span class="highlight">${avgResponseTime.toFixed(2)}</span></p>
        <p>Throughput: <span class="highlight">${throughput.toFixed(2)}%</span></p>
    `;
    
    // Prepare Gantt chart data
    const ganttData = [];
    const sortedByStart = [...processes].sort((a, b) => a.startTime - b.startTime);
    
    sortedByStart.forEach(process => {
        ganttData.push({
            pid: process.pid,
            start: process.startTime,
            end: process.completionTime
        });
    });
    
    createPriorityGanttChart(ganttData);
}

function createPriorityGanttChart(ganttData) {
    const ganttChart = document.getElementById('priority-gantt-chart');
    ganttChart.innerHTML = '';
    
    
    const startTime = Math.min(...ganttData.map(block => block.start));
    const endTime = Math.max(...ganttData.map(block => block.end));
    const totalTime = endTime - startTime;
    
    
    const containerWidth = Math.max(500, totalTime * 30);
    ganttChart.style.width = `${containerWidth}px`;
    
    const pixelPerUnit = containerWidth / totalTime;
    
    ganttData.forEach((block, index) => {
        const blockWidth = (block.end - block.start) * pixelPerUnit;
        const blockLeft = (block.start - startTime) * pixelPerUnit;
        
        const ganttBlock = document.createElement('div');
        ganttBlock.className = 'gantt-block';
        ganttBlock.textContent = `P${block.pid}`;
        ganttBlock.style.width = `${blockWidth}px`;
        ganttBlock.style.left = `${blockLeft}px`;
        ganttBlock.style.backgroundColor = colors[(block.pid - 1) % colors.length];
        
        ganttChart.appendChild(ganttBlock);
        
        // Start time label
        const startLabel = document.createElement('div');
        startLabel.className = 'time-label';
        startLabel.textContent = block.start;
        startLabel.style.left = `${blockLeft}px`;
        // Special handling for first label
        if (index === 0) {
            startLabel.style.transform = 'none';
            startLabel.style.paddingLeft = '5px';
        } else {
            startLabel.style.transform = 'translateX(-50%)';
        }
        
        ganttChart.appendChild(startLabel);
        
        // End time label for last block
        if (index === ganttData.length - 1) {
            const endLabel = document.createElement('div');
            endLabel.className = 'time-label';
            endLabel.textContent = block.end;
            endLabel.style.left = `${blockLeft + blockWidth}px`;
            endLabel.style.transform = 'translateX(-50%)';
            ganttChart.appendChild(endLabel);
        }
    });
}

// Display results in table and gantt chart
function displayResults(processes, algorithm, ganttChart = null) {
    // Show results div
    if (algorithm === 'priority') {
        console.log("In displayResults for priority, processes:", processes);
        console.log("Results div:", document.getElementById(`${algorithm}-results`));
        
        // Force the priority results to be visible
        document.getElementById('priority-results').style.display = 'block';
        document.getElementById('priority-gantt-chart').style.display = 'block';
        document.getElementById('priority-result-table').style.display = 'table';
        document.getElementById('priority-metrics').style.display = 'block';
    }
    
    document.getElementById(`${algorithm}-results`).style.display = 'block';
    
    // Populate result table
    const tableBody = document.getElementById(`${algorithm}-result-table`).querySelector('tbody');
    if (algorithm === 'priority') {
        console.log("Table body:", tableBody);
    }
    
    tableBody.innerHTML = '';
    
    processes.forEach(process => {
        const row = document.createElement('tr');
        
        let rowContent = `
            <td>P${process.pid}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>`;
            
        if (algorithm === 'priority') {
            rowContent += `<td>${process.priority}</td>`;
            console.log("Adding priority row for P" + process.pid + ", priority: " + process.priority);
        }
        
        rowContent += `
            <td>${process.startTime}</td>
            <td>${process.completionTime}</td>
            <td>${process.turnaroundTime}</td>
            <td>${process.waitingTime}</td>
            <td>${process.responseTime}</td>
        `;
        
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
        
        if (algorithm === 'priority') {
            console.log("Row added to table:", row);
        }
    });
    
    const avgTurnaroundTime = processes.reduce((sum, process) => sum + process.turnaroundTime, 0) / processes.length;
    const avgWaitingTime = processes.reduce((sum, process) => sum + process.waitingTime, 0) / processes.length;
    const avgResponseTime = processes.reduce((sum, process) => sum + process.responseTime, 0) / processes.length;
    

    const totalTime = Math.max(...processes.map(p => p.completionTime)) - Math.min(...processes.map(p => p.arrivalTime));
    const throughput = (processes.length / totalTime) * 100; // Convert to percentage
    
   
    let contextSwitches = 0;
    if (algorithm === 'srtf' && ganttChart) {
        
        contextSwitches = ganttChart.length - 1;
    } else {
    
        contextSwitches = processes.length - 1;
    }
    
    const metricsDiv = document.getElementById(`${algorithm}-metrics`);
    metricsDiv.innerHTML = `
        <p>Average Turnaround Time: <span class="highlight">${avgTurnaroundTime.toFixed(2)}</span></p>
        <p>Average Waiting Time: <span class="highlight">${avgWaitingTime.toFixed(2)}</span></p>
        <p>Average Response Time: <span class="highlight">${avgResponseTime.toFixed(2)}</span></p>
        <p>Throughput: <span class="highlight">${throughput.toFixed(2)}%</span></p>
        <p>Context Switches: <span class="highlight">${contextSwitches}</span></p>
    `;
    
    if (algorithm === 'priority') {
        console.log("Metrics added:", metricsDiv.innerHTML);
    }
    
    // Generate Gantt chart
    if (algorithm === 'srtf' && ganttChart) {
        // For SRTF, use the precomputed gantt chart
        createGanttChart(ganttChart, algorithm);
    } else {
        // For FCFS, SJF, and Priority, compute the gantt chart from process data
        const ganttData = [];
        
        if (algorithm === 'fcfs') {
            // For FCFS, processes are executed in sorted arrival time order
            const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            sortedProcesses.forEach(process => {
                ganttData.push({
                    pid: process.pid,
                    start: process.startTime,
                    end: process.completionTime
                });
            });
        } else if (algorithm === 'sjf' || algorithm === 'priority') {
            // For SJF and Priority, we need to reconstruct the execution order
            const sortedProcesses = [...processes].sort((a, b) => a.startTime - b.startTime);
            
            if (algorithm === 'priority') {
                console.log("Sorted by start time for Gantt chart:", sortedProcesses);
            }
            
            sortedProcesses.forEach(process => {
                ganttData.push({
                    pid: process.pid,
                    start: process.startTime,
                    end: process.completionTime
                });
            });
            
            if (algorithm === 'priority') {
                console.log("Gantt data for priority:", ganttData);
            }
        }
        
        createGanttChart(ganttData, algorithm);
    }
    
    if (algorithm === 'priority') {
        console.log("Display results function completed for priority");
    }
}

function setupEventListeners() {
    const algorithms = ['fcfs', 'sjf', 'srtf', 'priority'];
    algorithms.forEach(algorithm => {
        const calculateButton = document.getElementById(`${algorithm}-calculate`);
        calculateButton.onclick = () => {
            clearError(algorithm);
            calculate(algorithm);
        };
    });
}


function createGanttChart(ganttData, algorithm) {
    console.log(`Creating Gantt chart for ${algorithm} with data:`, ganttData);
    const ganttChart = document.getElementById(`${algorithm}-gantt-chart`);
    ganttChart.innerHTML = '';
    if (ganttData.length === 0) {
        ganttChart.innerHTML = '<p>No processes to display.</p>';
        return;
    }
    ganttData.sort((a, b) => a.start - b.start);
    const chartStartTime = 0; 
    const chartEndTime = Math.max(...ganttData.map(block => block.end));
    const totalChartTime = chartEndTime - chartStartTime;
    if (totalChartTime <= 0) {
        ganttChart.innerHTML = '<p>Invalid time range for Gantt chart.</p>';
        return;
    }
    const minWidth = 500;
    const calculatedWidth = totalChartTime * 30;
    const containerWidth = Math.max(minWidth, ganttChart.clientWidth, calculatedWidth);
    ganttChart.style.width = `${containerWidth}px`;
    const pixelPerUnit = containerWidth / totalChartTime;
    let lastEndTime = chartStartTime;
    ganttData.forEach((block, index) => {
        if (block.start > lastEndTime) {
            const idleWidth = (block.start - lastEndTime) * pixelPerUnit;
            const idleLeft = (lastEndTime - chartStartTime) * pixelPerUnit;
            const idleBlock = document.createElement('div');
            idleBlock.className = 'gantt-block idle';
            idleBlock.textContent = 'IDLE';
            idleBlock.style.width = `${idleWidth}px`;
            idleBlock.style.left = `${idleLeft}px`;
            idleBlock.style.backgroundColor = '#f0f0f0'; 
            idleBlock.style.color = '#666';
            idleBlock.style.border = '1px solid #ddd';
            ganttChart.appendChild(idleBlock);
            const idleStartLabel = document.createElement('div');
            idleStartLabel.className = 'time-label';
            idleStartLabel.textContent = lastEndTime;
            idleStartLabel.style.left = `${idleLeft}px`;
            if (lastEndTime === chartStartTime) {
                idleStartLabel.style.transform = 'none';
                idleStartLabel.style.paddingLeft = '2px'; 
            } else {
                idleStartLabel.style.transform = 'translateX(-50%)';
            }
            ganttChart.appendChild(idleStartLabel);
        }
        const blockWidth = (block.end - block.start) * pixelPerUnit;
        const blockLeft = (block.start - chartStartTime) * pixelPerUnit;
        const ganttBlock = document.createElement('div');
        ganttBlock.className = 'gantt-block';
        ganttBlock.textContent = `P${block.pid}`;
        ganttBlock.style.width = `${blockWidth}px`;
        ganttBlock.style.left = `${blockLeft}px`;
        ganttBlock.style.backgroundColor = colors[(block.pid - 1) % colors.length];
        ganttChart.appendChild(ganttBlock);
        // Add start time label for process block
        const startLabel = document.createElement('div');
        startLabel.className = 'time-label';
        startLabel.textContent = block.start;
        startLabel.style.left = `${blockLeft}px`;
        startLabel.style.transform = 'translateX(-50%)';
        if (block.start === chartStartTime && index === 0) {
            startLabel.style.transform = 'none';
            startLabel.style.paddingLeft = '2px';
        }
        ganttChart.appendChild(startLabel);
        // Add end time label for process block
        const endLabel = document.createElement('div');
        endLabel.className = 'time-label';
        endLabel.textContent = block.end;
        endLabel.style.left = `${blockLeft + blockWidth}px`;
        endLabel.style.transform = 'translateX(-50%)';
        ganttChart.appendChild(endLabel);
        lastEndTime = block.end;
    });
    console.log(`Gantt chart creation completed for ${algorithm}`);
}
function calculate(algorithm) {
    const processes = getProcessData(algorithm);
    if (!processes) return;

    switch (algorithm) {
        case 'fcfs':
            calculateFCFS(processes);
            break;
        case 'sjf':
            calculateSJF(processes);
            break;
        case 'srtf':
            calculateSRTF(processes);
            break;
        case 'priority':
            calculatePriority(processes);
            break;
    }
} 