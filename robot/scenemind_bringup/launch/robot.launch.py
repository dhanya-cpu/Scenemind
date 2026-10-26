<?xml version="1.0"?>
<launch>
  <arg name="simulation" default="true"/>
  <arg name="use_nav2" default="true"/>

  <!-- Robot State Publisher -->
  <include file="$(find-pkg-share scenemind_description)/launch/description.launch.py"/>

  <!-- Perception Bridge -->
  <node pkg="scenemind_perception" exec="vision_bridge" name="vision_bridge" output="screen">
    <param name="api_url" value="http://localhost:8000"/>
    <param name="camera_topic" value="/scenemind/camera/image_raw"/>
  </node>

  <!-- Navigation -->
  <group if="$(var use_nav2)">
    <include file="$(find-pkg-share scenemind_navigation)/launch/navigation.launch.py">
      <arg name="simulation" value="$(var simulation)"/>
    </include>
  </group>
</launch>
