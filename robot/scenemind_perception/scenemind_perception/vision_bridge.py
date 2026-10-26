#!/usr/bin/env python3
"""ROS2 vision bridge - forwards camera frames to SceneMind API."""

import rclpy
from rclpy.node import Node


class VisionBridge(Node):
  def __init__(self):
    super().__init__('vision_bridge')
    self.declare_parameter('api_url', 'http://localhost:8000')
    self.declare_parameter('camera_topic', '/scenemind/camera/image_raw')
    self.get_logger().info('Vision bridge initialized (connect to SceneMind API)')


def main():
  rclpy.init()
  node = VisionBridge()
  rclpy.spin(node)
  node.destroy_node()
  rclpy.shutdown()


if __name__ == '__main__':
  main()
