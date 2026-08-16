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

    # 2. Define Edges (Lanes and directions with custom width of 8m to match canvas lane offsets)
    edges_xml = """<edges>
    <edge id="W2C" from="W" to="C" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="C2E" from="C" to="E" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="E2C" from="E" to="C" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="C2W" from="C" to="W" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="N2C" from="N" to="C" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="C2S" from="C" to="S" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="S2C" from="S" to="C" numLanes="1" speed="13.89" width="8.0"/>
    <edge id="C2N" from="C" to="N" numLanes="1" speed="13.89" width="8.0"/>
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

    # 5. Create Routes & Demand Flows (With random turning paths for all directions)
    routes_xml = """<routes>
    <vType id="car" accel="2.6" decel="4.5" sigma="0.5" length="5" minGap="6.0" maxSpeed="13.89" color="0,1,0"/>
    <vType id="bus" accel="2.2" decel="3.5" sigma="0.5" length="12" minGap="6.0" maxSpeed="16.0" color="1,0,0"/>
    <vType id="truck" accel="2.5" decel="4.0" sigma="0.5" length="15" minGap="6.0" maxSpeed="17.0" color="0,0,1"/>
 
    <!-- North incoming flows (Straight, Left, Right) -->
    <flow id="flow_n2s" type="bus" begin="0" end="3600" period="5.4" departLane="0" from="N2C" to="C2S"/>
    <flow id="flow_n2e" type="bus" begin="0" end="3600" period="5.4" departLane="0" from="N2C" to="C2E"/>
    <flow id="flow_n2w" type="bus" begin="0" end="3600" period="5.4" departLane="0" from="N2C" to="C2W"/>

    <!-- South incoming flows (Straight, Left, Right) -->
    <flow id="flow_s2n" type="truck" begin="0" end="3600" period="6.0" departLane="0" from="S2C" to="C2N"/>
    <flow id="flow_s2w" type="truck" begin="0" end="3600" period="6.0" departLane="0" from="S2C" to="C2W"/>
    <flow id="flow_s2e" type="truck" begin="0" end="3600" period="6.0" departLane="0" from="S2C" to="C2E"/>

    <!-- West incoming flows (Straight, Left, Right) -->
    <flow id="flow_w2e" type="car" begin="0" end="3600" period="5.4" departLane="0" from="W2C" to="C2E"/>
    <flow id="flow_w2n" type="car" begin="0" end="3600" period="5.4" departLane="0" from="W2C" to="C2N"/>
    <flow id="flow_w2s" type="car" begin="0" end="3600" period="5.4" departLane="0" from="W2C" to="C2S"/>

    <!-- East incoming flows (Straight, Left, Right) -->
    <flow id="flow_e2w" type="car" begin="0" end="3600" period="6.6" departLane="0" from="E2C" to="C2W"/>
    <flow id="flow_e2s" type="car" begin="0" end="3600" period="6.6" departLane="0" from="E2C" to="C2S"/>
    <flow id="flow_e2n" type="car" begin="0" end="3600" period="6.6" departLane="0" from="E2C" to="C2N"/>
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
