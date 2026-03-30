from manim import *

class Scene_3fcf833d_90bf_4c2e_a412_b805f3c23b1c(Scene):
    def construct(self):
        a = 3
        b = 4
        c = (a**2 + b**2)**0.5
        equation = MathTex(f"a^2 + b^2 = c^2")
       
        
        self.camera.background_color = "#000000"
        self.play(Write(equation))
        self.wait(1)
        self.play(Write(equation2))
        self.wait(1)
        self.play(Write(equation3))
        self.wait(1)
        self.play(Write(equation4))
        self.wait(1)
        self.play(Write(equation5))
        self.wait(2)