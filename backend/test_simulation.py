import os
import sys
import time

if "SUMO_HOME" in os.environ:
    sys.path.append(os.path.join(os.environ["SUMO_HOME"], "tools"))
else:
    sys.exit("Please set SUMO_HOME environment variable.")

import traci

def run_test():
    sumo_binary = os.path.join(os.environ["SUMO_HOME"], "bin", "sumo")
    if os.name == 'nt':
        sumo_binary += ".exe"
        
    sumo_cfg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sumo_files", "sumo.sumocfg")
    
    if os.name == 'nt':
        os.system("taskkill /f /im sumo.exe >nul 2>&1")
        
    print("Starting SUMO TraCI test...")
    try:
        traci.start([sumo_binary, "-c", sumo_cfg, "--no-warnings", "--no-step-log"], port=8813)
        print("Connected to SUMO!")
        
        for step in range(1, 40):
            traci.simulationStep()
            vehs = traci.vehicle.getIDList()
            print(f"Step {step}: Active Vehicles Count = {len(vehs)}")
            if len(vehs) > 0:
                for v in vehs:
                    x, y = traci.vehicle.getPosition(v)
                    print(f"  - Vehicle {v} at pos: ({x}, {y})")
            time.sleep(0.1)
            
        traci.close()
        print("Test Complete!")
    except Exception as e:
        print("TraCI Test Error:", e)

if __name__ == "__main__":
    run_test()
