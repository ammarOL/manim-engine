from manim import *

class Output(Scene):
    def construct(self):
        self.camera.background_color = "#000000"
        circle = Circle(color=RED, fill_opacity=1)
        text = Text("shut up", font_size=42, color=WHITE)
        text.move_to(circle.get_center())
        group = VGroup(circle, text)
        self.add(group)