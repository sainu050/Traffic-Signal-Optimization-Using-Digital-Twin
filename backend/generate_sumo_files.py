import os
import subprocess
import sys

def generate_sumo_files():
    sumo_home = os.environ.get("SUMO_HOME")
    if not sumo_home:
        print("ERROR: SUMO_HOME environment variable is not defined.")
        sys.exit(1)
        
    # Create sumo_files directory inside backend
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sumo_files")
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Define Nodes (Junction coordinates offset by 200m)
    nodes_xml = """<nodes>
    <node id="C" x="300" y="300" type="traffic_light"/>
    <node id="N" x="300" y="500" type="priority"/>
    <node id="S" x="300" y="100" type="priority"/>
    <node id="W" x="100" y="300" type="priority"/>
    <node id="E" x="500" y="300" type="priority"/>
</nodes>"""

    # 2. Define Edges (Lanes and directions with speed=20.0 m/s ~ 72 km/h)
    edges_xml = """<edges>
    <edge id="W2C" from="W" to="C" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="C2E" from="C" to="E" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="E2C" from="E" to="C" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="C2W" from="C" to="W" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="N2C" from="N" to="C" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="C2S" from="C" to="S" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="S2C" from="S" to="C" numLanes="1" speed="20.0" width="8.0"/>
    <edge id="C2N" from="C" to="N" numLanes="1" speed="20.0" width="8.0"/>
</edges>"""

    # 3. Write files
    nod_file = os.path.join(out_dir, "sumo.nod.xml")
    edg_file = os.path.join(out_dir, "sumo.edg.xml")
    
    with open(nod_file, "w") as f:
        f.write(nodes_xml)
    with open(edg_file, "w") as f:
        f.write(edges_xml)

    # 4. Compile Network using netconvert
    netconvert_path = os.path.join(sumo_home, "bin", "netconvert")
    if os.name == 'nt':
        netconvert_path += ".exe"
        
    net_file = os.path.join(out_dir, "sumo.net.xml")
    print("Compiling SUMO road network using netconvert...")
    
    cmd = [
        netconvert_path,
        "--node-files=" + nod_file,
        "--edge-files=" + edg_file,
        "--output-file=" + net_file,
        "--offset.disable-normalization"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("netconvert failed:", result.stderr)
        sys.exit(1)
    else:
        print("Success! Created sumo.net.xml")

    # 5. Create Routes & Demand Flows (With diverse vehicle types and faster speeds)
    routes_xml = """<routes>
    <!-- Diverse Vehicle Types with Faster Dynamic Speeds and Responsive Accelerations -->
    <vType id="car" accel="3.4" decel="4.8" sigma="0.4" length="5" minGap="4.5" maxSpeed="19.5" color="0.23,0.51,0.96"/>
    <vType id="suv" accel="3.2" decel="4.6" sigma="0.4" length="6" minGap="4.8" maxSpeed="18.5" color="0.04,0.65,0.83"/>
    <vType id="motorcycle" accel="4.5" decel="5.5" sigma="0.3" length="3" minGap="3.0" maxSpeed="22.0" color="0.92,0.70,0.03"/>
    <vType id="bus" accel="2.6" decel="3.8" sigma="0.4" length="12" minGap="5.5" maxSpeed="16.5" color="0.94,0.27,0.27"/>
    <vType id="truck" accel="2.7" decel="4.0" sigma="0.4" length="14" minGap="5.5" maxSpeed="17.0" color="0.98,0.45,0.09"/>
    <vType id="ambulance" accel="4.2" decel="5.5" sigma="0.2" length="7" minGap="3.5" maxSpeed="24.0" color="1.0,1.0,1.0"/>
    <vType id="rickshaw" accel="3.0" decel="4.2" sigma="0.4" length="4" minGap="3.5" maxSpeed="16.0" color="0.13,0.77,0.37"/>

    <!-- All flows strictly sorted by begin time so SUMO never ignores any flow -->
    <!-- begin = 0.0: Primary Straight flows -->
    <flow id="flow_n2s_car" type="car" begin="0.0" end="3600" period="18.0" departLane="0" from="N2C" to="C2S"/>
    <flow id="flow_s2n_car" type="car" begin="0.0" end="3600" period="18.0" departLane="0" from="S2C" to="C2N"/>
    <flow id="flow_w2e_car" type="car" begin="0.0" end="3600" period="18.0" departLane="0" from="W2C" to="C2E"/>
    <flow id="flow_e2w_car" type="car" begin="0.0" end="3600" period="18.0" departLane="0" from="E2C" to="C2W"/>

    <!-- begin = 2.0: Right Turn car flows -->
    <flow id="flow_n2w_car" type="car" begin="2.0" end="3600" period="22.0" departLane="0" from="N2C" to="C2W"/>
    <flow id="flow_s2e_car" type="car" begin="2.0" end="3600" period="22.0" departLane="0" from="S2C" to="C2E"/>
    <flow id="flow_w2s_car" type="car" begin="2.0" end="3600" period="22.0" departLane="0" from="W2C" to="C2S"/>
    <flow id="flow_e2n_car" type="car" begin="2.0" end="3600" period="22.0" departLane="0" from="E2C" to="C2N"/>

    <!-- begin = 4.0: Left Turn car flows -->
    <flow id="flow_n2e_car" type="car" begin="4.0" end="3600" period="22.0" departLane="0" from="N2C" to="C2E"/>
    <flow id="flow_s2w_car" type="car" begin="4.0" end="3600" period="22.0" departLane="0" from="S2C" to="C2W"/>
    <flow id="flow_w2n_car" type="car" begin="4.0" end="3600" period="22.0" departLane="0" from="W2C" to="C2N"/>
    <flow id="flow_e2s_car" type="car" begin="4.0" end="3600" period="22.0" departLane="0" from="E2C" to="C2S"/>

    <!-- begin = 6.0: Right/Left turning Rickshaws, Bikes, SUVs -->
    <flow id="flow_n2w_rick" type="rickshaw" begin="6.0" end="3600" period="30.0" departLane="0" from="N2C" to="C2W"/>
    <flow id="flow_s2w_bike" type="motorcycle" begin="6.0" end="3600" period="30.0" departLane="0" from="S2C" to="C2W"/>
    <flow id="flow_w2s_rick" type="rickshaw" begin="6.0" end="3600" period="30.0" departLane="0" from="W2C" to="C2S"/>
    <flow id="flow_e2s_suv" type="suv" begin="6.0" end="3600" period="30.0" departLane="0" from="E2C" to="C2S"/>

    <!-- begin = 8.0: Left/Right turning Bikes & SUVs -->
    <flow id="flow_n2e_bike" type="motorcycle" begin="8.0" end="3600" period="30.0" departLane="0" from="N2C" to="C2E"/>
    <flow id="flow_s2e_suv" type="suv" begin="8.0" end="3600" period="30.0" departLane="0" from="S2C" to="C2E"/>
    <flow id="flow_w2n_bike" type="motorcycle" begin="8.0" end="3600" period="30.0" departLane="0" from="W2C" to="C2N"/>
    <flow id="flow_e2n_bike" type="motorcycle" begin="8.0" end="3600" period="30.0" departLane="0" from="E2C" to="C2N"/>

    <!-- begin = 10.0: Heavy Transit Straight flows (Buses, Cargo Trucks) -->
    <flow id="flow_n2s_bus" type="bus" begin="10.0" end="3600" period="40.0" departLane="0" from="N2C" to="C2S"/>
    <flow id="flow_s2n_truck" type="truck" begin="10.0" end="3600" period="40.0" departLane="0" from="S2C" to="C2N"/>
    <flow id="flow_w2e_bus" type="bus" begin="10.0" end="3600" period="40.0" departLane="0" from="W2C" to="C2E"/>
    <flow id="flow_e2w_truck" type="truck" begin="10.0" end="3600" period="40.0" departLane="0" from="E2C" to="C2W"/>

    <!-- begin = 14.0: Secondary Straight flows (SUVs & Auto-Rickshaws) -->
    <flow id="flow_n2s_suv" type="suv" begin="14.0" end="3600" period="35.0" departLane="0" from="N2C" to="C2S"/>
    <flow id="flow_s2n_rick" type="rickshaw" begin="14.0" end="3600" period="35.0" departLane="0" from="S2C" to="C2N"/>
    <flow id="flow_w2e_suv" type="suv" begin="14.0" end="3600" period="35.0" departLane="0" from="W2C" to="C2E"/>
    <flow id="flow_e2w_rick" type="rickshaw" begin="14.0" end="3600" period="35.0" departLane="0" from="E2C" to="C2W"/>
</routes>"""

    rou_file = os.path.join(out_dir, "sumo.rou.xml")
    with open(rou_file, "w") as f:
        f.write(routes_xml)
    print("Created sumo.rou.xml")

    # 6. Create SUMO Config File (.sumocfg)
    config_xml = f"""<configuration>
    <input>
        <net-file value="sumo.net.xml"/>
        <route-files value="sumo.rou.xml"/>
    </input>
    <time>
        <begin value="0"/>
        <end value="3600"/>
    </time>
</configuration>"""

    cfg_file = os.path.join(out_dir, "sumo.sumocfg")
    with open(cfg_file, "w") as f:
        f.write(config_xml)
    print("Created sumo.sumocfg")
    print("\nSUMO Environment Files generation complete!")

if __name__ == "__main__":
    generate_sumo_files()
